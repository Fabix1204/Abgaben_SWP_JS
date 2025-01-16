from flask import Flask, request,jsonify
from sqlalchemy import Column, Integer, Text, Float, DateTime, create_engine, ForeignKey, func, and_
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql.expression import func
from flask_restful import Resource, Api
from dataclasses import dataclass
#import json
import simplejson as j
import pandas as pd
from flask_cors import CORS, cross_origin

Base = declarative_base()  # Basisklasse aller in SQLAlchemy verwendeten Klassen
metadata = Base.metadata

engine = create_engine('sqlite:///olympics.db', echo=True)

db_session = scoped_session(sessionmaker(autoflush=True, bind=engine))
Base.query = db_session.query_property() #Dadurch hat jedes Base - Objekt (also auch ein GeoInfo) ein Attribut query für Abfragen
app = Flask(__name__) #Die Flask-Anwendung
cors = CORS(app) # Ohne dieser Anweisung
# darf man von Webseiten aus nicht zugrfeifen
api = Api(app) #Die Flask API


@dataclass
class NocRegions(Base):
    noc : str
    region : str
    notes : str

    __tablename__ = 'noc_regions'
    noc = Column('NOC', Text, primary_key=True)
    region = Column('region', Text)
    notes = Column('notes', Text)


@dataclass #Diese ermoeglicht das Schreiben als JSON mit jsonify
class AthleteEvents(Base):
    __tablename__ = 'athlete_events'

    id: int
    name: str
    sex: str
    age: int
    height: int
    weight: int
    noc: NocRegions

    id = Column('ID', Integer, primary_key=True)
    name = Column('Name', Text)
    sex = Column('Sex', Text)
    age = Column('Age', Integer)
    height = Column('Height', Integer)
    weight = Column('Weight', Integer)
    team = Column('Team', Text)
    noc = Column('NOC', Text, ForeignKey(NocRegions.noc))
    games = Column('Games', Text)
    year = Column('Year', Integer)
    season = Column('Season', Text)
    city = Column('City', Text)
    sport = Column('Sport', Text)
    event = Column('Event', Text)
    medal = Column('Medal', Text)



@app.route('/event_by_noc/<string:noc>')
def event_by_noc(noc):
    infos = AthleteEvents.query.filter(AthleteEvents.noc == noc).all()
    return jsonify(infos)

@app.route('/regions')
def regions():
    infos = NocRegions.query.all()
    return  jsonify(infos)

@app.route('/events')
def events():
    infos = db_session.query(AthleteEvents.event).distinct(AthleteEvents.event).order_by(AthleteEvents.event).all()
    return  j.dumps(infos)

def medals_by_noc(noc):
    m = db_session.query(AthleteEvents.medal, func.count(AthleteEvents.medal)).filter(and_(AthleteEvents.medal != 'NA',AthleteEvents.noc == noc)).group_by(AthleteEvents.medal).all()

    a = []
    for i in m:
        a.append([i[0], i[1]])


    m = pd.DataFrame.from_records(m, columns=['medal', 'cnt'])
    print(m)
    m['medal'] = pd.Categorical(m['medal'], ["Gold", "Silver", "Bronze"])
    m =  m.sort_values("medal")
    return m.values.tolist()

@app.route('/medals/<string:noc>')
def medals(noc):
    m = medals_by_noc(noc)
    return jsonify(m)

@app.route('/medals2/<string:noc>')
def medals2(noc):
    m = medals_by_noc(noc)
    key = []
    val = []
    for i in m:
        print(i[0] , i[1])
        key.append(i[0])
        val.append(i[1])
    res = [{'x' : key, 'y' : val , 'type':'bar'}]
    return j.dumps(res)


@app.route('/count_by_sex')
def events_group_by_sex():
    res = engine.execute("SELECT sex, medal, count(*) FROM athlete_events WHERE medal != 'NA' GROUP BY sex, medal")
    res = [(row[0], row[1], row[2]) for row in res]
    print(res)
    return j.dumps(res)

@app.route('/count_by_sex2')
def events_group_by_sex2():
    res = engine.execute("SELECT sex, medal, count(*) FROM athlete_events WHERE medal != 'NA' GROUP BY sex, medal")
    keyM = []
    valM = []
    keyF = []
    valF = []
    for r in res:
        if r[0] == 'M':
            keyM.append(r[1])
            valM.append(r[2])
        else:
            keyF.append(r[1])
            valF.append(r[2])
    res = [(row[0], row[1], row[2]) for row in res]
    res = [{'x': keyM, 'y': valM, 'type': 'bar'},{'x': keyF, 'y': valF, 'type': 'bar'}]
    return j.dumps(res)



@app.teardown_appcontext
def shutdown_session(exception=None):
    print("Shutdown Session")
    db_session.remove()


if __name__ == '__main__':
    app.run(debug=True)