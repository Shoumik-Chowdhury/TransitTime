/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Circle,
} from "react-leaflet";
import axios from "axios";
import useInterval from "react-useinterval";
// import { useTheme } from "@mui/material/styles";

export const Map = (props) => {
  let [map, setMap] = useState(null);

  let [stopCoordinate, setStopCoordinate] = useState({
    lat: 53.53414,
    lon: -113.50254,
  });
  let [busCoordinate, setBusCoordinate] = useState({
    lat: 53.5341,
    lon: -113.50227,
  });
  let [timeUpdate, setTimeUpdate] = useState(null);
  let [routeMarkers, setRouteMarkers] = useState([]);

  let stopId = props.stop_id;
  let busId = props.vehicle_id;
  let routeId = props.route_id;

  // Mapbox config
  const mapKey = process.env.REACT_APP_MAPBOX_KEY;
  let style = "ckyqkh1f811fy14k876mhrntc";

  // useEffect(() => {
  //   props.mode === "dark"
  //     ? (style = "ckyqkh1f811fy14k876mhrntc")
  //     : (style = "ckyqr2lq1062y15ljbgv22gzf");
  // });

  const point = L.point(0, -18);

  const busIcon = L.icon({
    iconUrl: "./assets/bus_pos.png",
    iconSize: [24.4, 28],
    iconAnchor: [12.2, 28],
  });

  const stopIcon = L.icon({
    iconUrl: "./assets/stop_icon.png",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  const SetView = (lat, lon) => {
    if (map) {
      map.panTo([lat, lon]);
    }
    return null;
  };

  const fetchBus = () => {
    axios
      .get(`api/busLocation/${busId}`)
      .then((res) => {
        let data = res.data.position;
        console.log("Recieved from api: \nBus COORD: ", data);
        if (data) {
          setBusCoordinate((prev) => ({
            ...prev,
            lat: data.latitude,
            lon: data.longitude,
          }));
        }
        // Get time last updated
        let timeDiff = Math.floor(Date.now() / 1000) - res.data.time.low;
        setTimeUpdate((prev) => timeDiff);
      })
      .catch((err) => console.log(err));
  };

  const fetchRoute = () => {
    axios
      .get(`api/busRoute/${routeId}`)
      .then((res) => {
        let stopMarkers = res.data.map((obj) => {
          return (
            <Circle
              center={[obj.lat, obj.lon]}
              pathOptions={{ color: "blue" }}
              radius={4}
            />
          );
        });
        return stopMarkers;
      })
      .then((data) => {
        setRouteMarkers(data);
      });
  };

  useEffect(() => {
    axios
      .get(`api/stopLocation/${stopId}`)
      .then((res) => {
        if (Object.keys(res.data).length === 0) {
          console.log("NO STOPS FOUND!");
        }
        if (Object.keys(res.data).length !== 0) {
          setStopCoordinate((prev) => ({
            ...prev,
            lat: Number(res.data.stop_lat),
            lon: Number(res.data.stop_lon),
          }));
          console.log("Set stop COORD to:", stopCoordinate);
        }
      })
      .catch((err) => console.log(err));

    // Initial request busLocation
    fetchBus();

    //Initial route request
    fetchRoute();
  }, []);

  useEffect(() => {
    SetView(busCoordinate.lat, busCoordinate.lon);
  }, []);

  useInterval(() => {
    fetchBus();
  }, 10000);

  return (
    <>
      <MapContainer
        id="map"
        whenCreated={(map) => {
          setMap(map);
        }}
        center={[stopCoordinate.lat, stopCoordinate.lon]}
        zoom={12}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={`https://api.mapbox.com/styles/v1/shoumik2022/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapKey}`}
        />
        <Marker
          icon={busIcon}
          position={[busCoordinate.lat, busCoordinate.lon]}
        >
          <Tooltip
            permanent={true}
            direction={"top"}
            opacity={0.8}
            offset={point}
          >
            Updated: {timeUpdate}s ago.
          </Tooltip>
        </Marker>
        <Marker
          icon={stopIcon}
          position={[stopCoordinate.lat, stopCoordinate.lon]}
        >
          <Popup>Stop: #{stopId}</Popup>
        </Marker>
        {routeMarkers}
      </MapContainer>
    </>
  );
};
