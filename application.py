import os
import re
from flask import Flask, jsonify, render_template, request, url_for, redirect
from flask_jsglue import JSGlue
from flask_sqlalchemy import SQLAlchemy
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

    # marker_data = []

    # for row in db.execute('SELECT * FROM events'):
    #     data = {'eventName': row[0],
    #             'month': row[1],
    #             'day': row[2],
    #             'year': row[3],
    #             'hour': row[4],
    #             'minutes': row[5],
    #             'AM_PM': row[6],
    #             'eventType': row[7],
    #             'latitude': row[8],
    #             'longitude': row[9]
    #     }
# 
    # marker_data.append(data)

    return render_template("index.html", key=os.environ.get("API_KEY"))

@app.route("/submit", methods=["POST", "GET"])
def submit():
    # if request.method == "POST":
    eventName = request.form.get("eventName")
    datetime = request.form.get("datetime")

    date_string = datetime.split(' ')
    date = date_string[0].split('/')
    month = date[0]
    day = date[1]
    year = date[2]

    day_string = date_string[1].split(':')
    hour = day_string[0]
    minutes = day_string[1]

    AM_PM = date_string[2]

    eventType = request.form.get("eventType")
    position = request.form.get("position")

    latlong = position.split(', ')
    latitude = latlong[0]
    longitude = latlong[1]

    sql_info = (eventName, month, day, year, hour, minutes, AM_PM, eventType, latitude, longitude)
    db.execute('INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?)', sql_info)

    # Save (commit) the changes and (close) them
    conn.commit()
    
    # return redirect(url_for("index"))
    return '{"message": "OK"}'

@app.route("/query")
def query():
    marker_data = []

    for row in db.execute('SELECT * FROM events'):
        data = {'eventName': row[0],
                'month': row[1],
                'day': row[2],
                'year': row[3],
                'hour': row[4],
                'minutes': row[5],
                'AM_PM': row[6],
                'eventType': row[7],
                'latitude': row[8],
                'longitude': row[9]
        }
        marker_data.append(data)

    return jsonify(marker_data)
    


@app.route("/update")
def update():
    """Find up to 10 places within view."""

    # ensure parameters are present
    if not request.args.get("sw"):
        raise RuntimeError("missing sw")
    if not request.args.get("ne"):
        raise RuntimeError("missing ne")

    # ensure parameters are in lat,lng format
    if not re.search("^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$", request.args.get("sw")):
        raise RuntimeError("invalid sw")
    if not re.search("^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$", request.args.get("ne")):
        raise RuntimeError("invalid ne")

    # explode southwest corner into two variables
    (sw_lat, sw_lng) = [float(s) for s in request.args.get("sw").split(",")]

    # explode northeast corner into two variables
    (ne_lat, ne_lng) = [float(s) for s in request.args.get("ne").split(",")]

    # find 10 cities within view, pseudorandomly chosen if more within view
    if (sw_lng <= ne_lng):

        # doesn't cross the antimeridian
        rows = db.execute("""SELECT * FROM places
            WHERE :sw_lat <= latitude AND latitude <= :ne_lat AND (:sw_lng <= longitude AND longitude <= :ne_lng)
            GROUP BY country_code, place_name, admin_code1
            ORDER BY RANDOM()
            LIMIT 10""",
            sw_lat=sw_lat, ne_lat=ne_lat, sw_lng=sw_lng, ne_lng=ne_lng)

    else:

        # crosses the antimeridian
        rows = db.execute("""SELECT * FROM places
            WHERE :sw_lat <= latitude AND latitude <= :ne_lat AND (:sw_lng <= longitude OR longitude <= :ne_lng)
            GROUP BY country_code, place_name, admin_code1
            ORDER BY RANDOM()
            LIMIT 10""",
            sw_lat=sw_lat, ne_lat=ne_lat, sw_lng=sw_lng, ne_lng=ne_lng)

    # output places as JSON
    return jsonify(rows)

if __name__ == "__main__":
    # port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, use_reloader=True)
