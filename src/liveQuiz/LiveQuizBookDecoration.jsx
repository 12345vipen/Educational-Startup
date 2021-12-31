import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { isCurrentUserAdmin } from "../widgets/IsCurrentUserAdmin";
import { db } from "../firebase";
import SuccessErrorPopUp from "../widgets/SuccessErrorPopUp";
import { useHistory } from "react-router-dom"; // version 5.2.0

const LiveQuizBookDecoration = (props) => {
  const { currentUser } = useAuth();
  const history = useHistory();
  const [isAdmin, setIsAdmin] = useState(false);
  const [seatBooked, setSeatBooked] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [userDetails, setUserDetails] = useState("");
  const [eventDate, setEventDate] = useState(true);

  useEffect(() => {
    const checkEvent = () => {
      var x = new Date();
      if (x.getFullYear() !== props.year) {
        if (x.getFullYear() > props.year) {
          setEventDate(false);
        }
      } else {
        if (x.getMonth() > props.month) {
          setEventDate(false);
        } else if (x.getMonth() < props.month) {
          setEventDate(true);
        } else {
          if (x.getDate() > props.date) {
            setEventDate(false);
          } else if (x.getDate() === props.date) {
            if (x.getHours() > props.hours) {
              setEventDate(false);
            } else if (x.getHours() === props.hours) {
              if (x.getMinutes() > props.minutes) {
                setEventDate(false);
              }
            }
          }
        }
      }
    };
    checkEvent();
  }, [props.year, props.month, props.date, props.hours, props.minutes]);

  useEffect(() => {
    if (currentUser) {
      db.collection("Dashboard")
        .doc(currentUser.email)
        .collection("RegisteredLiveQuiz")
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            // doc.data() is never undefined for query doc snapshots
            if (doc.id === props.liveQuizId) {
              setRegistered(true);
              setSeatBooked(3);
            }
          });
        });
    }
  }, [currentUser, seatBooked, props.liveQuizId]);
  useEffect(() => {
    isCurrentUserAdmin({ setIsAdmin, currentUser });
  }, [currentUser]);

  const handleDeleteTimeSlot = () => {
    db.collection("LiveQuiz")
      .doc(props.liveQuizId)
      .collection("TimeSlots")
      .doc(props.ids)
      .delete();
  };

  useEffect(() => {
    if (userDetails !== "" && seatBooked !== 3) {
      db.collection("LiveQuiz")
        .doc(props.liveQuizId)
        .collection("TimeSlots")
        .doc(props.ids)
        .collection("Emails")
        .doc(currentUser.email)
        .set({
          email: currentUser.email,
        })
        .catch((e) => {
          setSeatBooked(1);
          return;
        });
      db.collection("Dashboard")
        .doc(currentUser.email)
        .collection("RegisteredLiveQuiz")
        .doc(props.liveQuizId)
        .set({
          liveQuizId: props.liveQuizId,
          quizId: props.ids,
        })
        .catch((e) => {
          setSeatBooked(1);
          return;
        });
      setSeatBooked(2);

      db.collection("LiveQuiz")
        .doc(props.liveQuizId)
        .collection("TimeSlots")
        .doc(props.ids)
        .update({
          seats: userDetails.seats - 1,
        })
        .catch((e) => {
          setSeatBooked(1);
          return;
        });
    }
    return () => {
      setUserDetails("");
    };
  }, [userDetails, seatBooked]);
  const handleAddToCalendar = async () => {
    await db
      .collection("LiveQuiz")
      .doc(props.liveQuizId)
      .collection("TimeSlots")
      .doc(props.ids)
      .get()
      .then((snapshot) => setUserDetails(snapshot.data()));

    if (userDetails.seats <= 0) {
      setSeatBooked(3);
      return;
    }
    history.push("/registered-live-quiz");
  };

  return (
    <div>
      {seatBooked === 3 && (
        <SuccessErrorPopUp
          severity="warning"
          message="You can only book 1 slot! Go to Dashboard"
        />
      )}
      {seatBooked === 1 && (
        <SuccessErrorPopUp
          severity="error"
          message="Something Went Wrong Try again!"
        />
      )}
      {seatBooked === 2 && (
        <SuccessErrorPopUp
          severity="success"
          message="Seat Booked Go to dashboard"
        />
      )}
      {eventDate ? (
        <Box
          sx={{
            padding: "20px",
            margin: "20px",
            backgroundColor: props.seats <= 0 ? "#525252" : "#E3F2FD",
            "&:hover": {
              padding: "30px",
              opacity: [0.9, 0.8, 0.7],
            },
          }}
        >
          {props.seats > 0 ? (
            <h1 style={{ textAlign: "center" }}>Seats left {props.seats}</h1>
          ) : (
            <h1 style={{ textAlign: "center" }}> 😔</h1>
          )}

          <p style={{ textAlign: "center" }}>
            Date: {props.date}-{props.month + 1}-{props.year} at ⌚{props.hours}
            :{props.minutes}
          </p>
          {props.seats > 0 ? (
            <>
              {registered ? (
                <Button variant="secondary" backgroundColor="#00695C">
                  Seat Booked
                </Button>
              ) : (
                <Button
                  variant="primary"
                  backgroundColor="#00695C"
                  onClick={handleAddToCalendar}
                >
                  Add to your Calendar
                </Button>
              )}
            </>
          ) : (
            <Button variant="secondary" backgroundColor="#00695C">
              All seats booked
            </Button>
          )}

          {isAdmin && (
            <Button
              className="ms-3"
              variant="primary"
              backgroundColor="#00695C"
              onClick={handleDeleteTimeSlot}
            >
              ❌
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            padding: "20px",
            margin: "20px",
            backgroundColor: "#525252",
            "&:hover": {
              padding: "30px",
              opacity: [0.9, 0.8, 0.7],
            },
          }}
        >
          
            <h1 style={{ textAlign: "center" }}> 😔</h1>
         

          <p style={{ textAlign: "center" }}>
            Date: {props.date}-{props.month + 1}-{props.year} at ⌚{props.hours}
            :{props.minutes}
          </p>
          <Button
                  variant="primary"
                  backgroundColor="#00695C"
                  onClick={handleAddToCalendar}
                >
                  Quiz passed!
                </Button>

          {isAdmin && (
            <Button
              className="ms-3"
              variant="primary"
              backgroundColor="#00695C"
              onClick={handleDeleteTimeSlot}
            >
              ❌
            </Button>
          )}
        </Box>
      )}
    </div>
  );
};

export default LiveQuizBookDecoration;
