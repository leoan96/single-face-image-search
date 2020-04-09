import pathlib
import pika
import os
from PIL import Image
from io import BytesIO
import matplotlib.pyplot as plt
import numpy as np

from mtcnn import MTCNN
from keras.models import load_model

from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder, Normalizer

from sklearn.svm import SVC
from sklearn.neighbors import NearestNeighbors


"""
1. Search function
"""
root_path = pathlib.Path(__file__).resolve().parent
image_path = root_path.joinpath("imgs")

# 1. Get image file paths
img_ext = (".jpg", ".jpeg", ".png")
counter = 0
img_paths = []
for root, dirs, files in os.walk(image_path):

    img_dir = pathlib.Path(root)
    label = root.split("/")[-1]
    for file in files:
        if file.endswith(img_ext):
            img_paths.append(img_dir.joinpath(file).as_posix())
            counter += 1

print(f"No. of files: {counter}")

# 2.1 Load raw images from file path and change the raw images into numpy arrays to enable the mtcnn to detect the faces
def load_images(files):
    images = []
    for image in files:
        img = Image.open(image)
        img = img.convert("RGB")
        pixels = np.asarray(img)
        images.append(pixels)
    return images


# 2.2 Takes in numpy arrays of faces and detects the faces. The detected faces are then cropped out and saved into faces array
def detect_faces(imgs, detector):
    faces = []
    for img in imgs:
        results = detector.detect_faces(img)
        x1, y1, width, height = results[0]["box"]
        x1, y1 = abs(x1), abs(y1)
        x2, y2 = (x1 + width), (y1 + height)
        face = img[y1:y2, x1:x2]
        faces.append(face)
    return faces


# 2.3 The cropped faces array are converted into PIL images to resize them all into equal sizes. Then they are converted back to numpy array to be passed into the FaceNet
def resize_faces(faces, size=(160, 160)):
    resized_faces = []
    for face in faces:
        img = Image.fromarray(face)
        img = img.resize(size)
        face_array = np.asarray(img)
        resized_faces.append(face_array)
    return np.asarray(resized_faces)


# 2. Extract faces from raw image
def extract_face(img_paths):
    detector = MTCNN()
    raw_images = load_images(img_paths)
    face = detect_faces(raw_images, detector)
    resized_face = resize_faces(face)
    return resized_face


faces = extract_face(img_paths)

# 3.a Get individual face embeddings
def get_embedding(model, face_pixel):
    face_pixel = face_pixel.astype("float32")
    mean, std = face_pixel.mean(), face_pixel.std()
    face_pixel = (face_pixel - mean) / std

    samples = np.expand_dims(face_pixel, axis=0)
    predicted = model.predict(samples)

    return predicted[0]


# Load keras facenet model
model = root_path.joinpath("model.h5").as_posix()
model = load_model(model)

# 3.b Get multiple face embeddings
def get_embeddings(model, faces):
    face_pixels = faces.astype("float32")
    mean, std = face_pixels.mean(), face_pixels.std()
    face_pixels = (face_pixels - mean) / std

    predicted = model.predict(face_pixels)
    return predicted


face_embeddings = get_embeddings(model, faces)


def query_image(img, model):
    face_extract = extract_face(img)
    face_extract = np.squeeze(face_extract, axis=0)
    plt.imshow(face_extract)
    face_embedding = get_embedding(model, face_extract)
    face_embedding = np.expand_dims(face_embedding, axis=0)

    return face_embedding


def closest_test_images(codes, query_image, n_neigh=10):
    n_neigh = n_neigh
    nbrs = NearestNeighbors(n_neighbors=n_neigh, metric="euclidean")
    nbrs.fit(codes)
    distances, indices = nbrs.kneighbors(query_image)

    closest_images = []
    for index in indices[0]:
        closest_images.append(img_paths[index])

    return closest_images

    # fig = plt.figure(figsize=(20, 50))
    # for i in range(n_neigh):
    #     ax = fig.add_subplot(10, 4, i + 1)
    #     img_array = np.asarray(Image.open(closest_images[i]).convert("RGB"))
    #     plt.imshow(img_array)
    #     ax.get_xaxis().set_visible(False)
    #     ax.get_yaxis().set_visible(False)
    # plt.show()


"""
i = image_path.joinpath("2504.jpg").as_posix()
test_query = query_image([i], model)

closest_test_images(face_embeddings, test_query)
"""

"""
2. RPC Server
"""

# credentials = pika.PlainCredentials("the_user", "the_pass")
# parameters = pika.ConnectionParameters("127.0.0.1", 15672, "/", credentials)

# connection = pika.BlockingConnection(parameters)

# connection = pika.BlockingConnection(pika.ConnectionParameters("rabbit", "5672"))
host = os.environ.get('PYTHON_RABBITMQ_HOST')
port = os.environ.get('PYTHON_RABBITMQ_PORT')
connection = pika.BlockingConnection(pika.ConnectionParameters(host, port))

channel = connection.channel()

channel.queue_declare(queue="rpc_queue", durable=True)


def on_request(ch, method, props, body):
    print(f" [.] Search request incoming...")
    # print(f"{body}")

    # i = image_path.joinpath("2504.jpg").as_posix()
    i = BytesIO(body)
    test_query = query_image([i], model)

    # INITIALLY INTENDED TO SEND RAW IMAGE BINARY DATA BUT FAILED TO DISPLAY THE IMAGE IN THE PUG
    # TEMPLATES DESPITE BEST EFFORTS
    # closest_images_path = closest_test_images(face_embeddings, test_query)
    # closest_images = []
    # for image_path in closest_images_path:
    #     img = b""
    #     with open(image_path, "rb") as f:
    #         for pixels in f:
    #             img += pixels
    #     closest_images.append(img)

    closest_images = closest_test_images(face_embeddings, test_query)

    response = closest_images
    print("Images retrieved!")

    ch.basic_publish(
        exchange="",
        routing_key=props.reply_to,
        properties=pika.BasicProperties(correlation_id=props.correlation_id),
        body=str(response),
    )

    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue="rpc_queue", on_message_callback=on_request)

print(" [*] Waiting for RPC request...")
channel.start_consuming()
