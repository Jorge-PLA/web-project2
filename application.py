import os

from flask import Flask, render_template, session, jsonify, request
from flask_session import Session
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

actual_channel= "# General"
channels = ["# General"]
messages ={"# General":[]}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/create", methods=["POST"])
def create():
    new_channel ='# ' + request.form.get("new_channel")
    if new_channel in channels:
        return ('', 204)
    channels.append(new_channel)
    messages[new_channel] = []
    last = len(channels) - 1

    return channels[last]

@app.route("/load_channels", methods=["POST"])
def load_channels():

    return jsonify(channels)

#Route for load the messages of the channel
@app.route("/load_messages",  methods=["POST"])
def load_messages():
    global actual_channel
    actual_channel = request.form.get("current_channel")
    return (jsonify(messages[actual_channel]), actual_channel)

@socketio.on("send msg")
def send_msg(message):
    im = False
    nickname = message['nickname']
    msg = message['msg']
    msg_time = message['msg_time']
    msg_now = tuple([nickname, msg, msg_time, im])
    messages[actual_channel].append(msg_now)
    #if there are more than 100 messages it will erase it
    if len(messages[actual_channel]) > 100:
        messages[actual_channel].pop(0)
    sender = []
    sender.append(msg_now)
    emit("sent msg", sender, broadcast=True )

@socketio.on("send img")
def send_img(message):
    #send if the sender is an img
    im = True
    nickname = message['nickname']
    msg = message['msg']
    msg_time = message['msg_time']
    msg_now = tuple([nickname, msg, msg_time, im])
    messages[actual_channel].append(msg_now)
    #if there are more than 100 messages it will erase it
    if len(messages[actual_channel]) > 100:
        messages[actual_channel].pop(0)
    sender = []
    sender.append(msg_now)
    emit("sent msg", sender, broadcast=True )

if __name__ == '__main__':

    app.run()
