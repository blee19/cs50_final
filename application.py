import os
from flask import Flask, jsonify, render_template, request
from flask_jsglue import JSGlue
import sqlite3
from helpers import lookup

# configure application
app = Flask(__name__)
JSGlue(app)

# setting up sqlite
conn = sqlite3.connect('mashup.db', check_same_thread=False)
db = conn.cursor()

# ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response

@app.route("/")
def index():
    """Render map."""
    if not os.environ.get("API_KEY"):
        raise RuntimeError("API_KEY not set")

    return render_template("index.html", key=os.environ.get("API_KEY"))

# delete event upon clicking delete button
@app.route("/delete")
def delete():
    """Delete the event listed on the map"""
    
    eventID = request.args.get("eventID")
    db.execute('DELETE FROM events WHERE id = ' + eventID)
    conn.commit()

    return '{"message": "OK"}'

# delete from events where id=1;
@app.route("/submit", methods=["POST"])
def submit():
    event_name = request.form.get("eventName")
    date_time = request.form.get("datetime")
    event_type = request.form.get("eventType")
    position = request.form.get("position")

    latlong = position.split(', ')
    latitude = latlong[0]
    longitude = latlong[1]

    sql_info = (event_name, date_time, event_type, latitude, longitude)
    db.execute('INSERT INTO events (event_name, date_time, event_type, latitude, longitude) VALUES (?,?,?,?,?)', sql_info)

    # Save (commit) the changes
    conn.commit()
    
    db.execute('SELECT id from events ORDER BY id DESC LIMIT 1')

    eventID = db.fetchone()[0]

    return '{"eventID": ' + str(eventID) + '}'

@app.route("/query")
def query():
    marker_data = []

    # get event data from user
    for row in db.execute('SELECT * FROM events'):

        data = {'event_name': row[0],
                'date_time': row[1],
                'event_type': row[2],
                'latitude': row[3],
                'longitude': row[4],
                'id': row[5]
        }
        marker_data.append(data)

    # return JSON format of event data entered by user
    return jsonify(marker_data)

# running app properly
if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)
