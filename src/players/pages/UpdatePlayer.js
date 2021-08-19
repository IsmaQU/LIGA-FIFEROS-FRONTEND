import React, { useEffect, useState, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";

import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import Card from "../../shared/components/UIElements/Card";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH,
} from "../../shared/util/validators";
import { useForm } from "../../shared/hooks/form-hook";
import { useHttpClient } from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import "./PlayerForm.css";

const UpdatePlayer = () => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [loadedPlayer, setLoadedPlayer] = useState();
  const playerId = useParams().playerId;
  const history = useHistory();

  const [formState, inputHandler, setFormData] = useForm(
    {
      title: {
        value: "",
        isValid: false,
      },
      clausula: {
        value: "",
        isValid: false,
      },
    },
    false
  );

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/players/${playerId}`
        );
        setLoadedPlayer(responseData.player);
        setFormData(
          {
            title: {
              value: responseData.player.title,
              isValid: true,
            },
            clausula: {
              value: responseData.player.clausula,
              isValid: true,
            },
          },
          true
        );
      } catch (err) {}
    };
    fetchPlayer();
  }, [sendRequest, playerId, setFormData]);

  const playerUpdateSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/players/${playerId}`,
        "PATCH",
        JSON.stringify({
          title: formState.inputs.title.value,
          clausula: formState.inputs.clausula.value,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      history.push("/" + auth.userId + "/players");
    } catch (err) {}
  };

  if (isLoading) {
    return (
      <div className="center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!loadedPlayer && !error) {
    return (
      <div className="center">
        <Card>
          <h2>Could not find player!</h2>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {!isLoading && loadedPlayer && (
        <form className="place-form" onSubmit={playerUpdateSubmitHandler}>
          <Input
            id="title"
            element="input"
            type="text"
            label="Title"
            validators={[VALIDATOR_REQUIRE()]}
            errorText="Please enter a valid title."
            onInput={inputHandler}
            initialValue={loadedPlayer.title}
            initialValid={true}
          />
          <Input
            id="clausula"
            element="textarea"
            label="Cláusula de rescisión"
            validators={[VALIDATOR_MINLENGTH(5)]}
            errorText="Please enter a valid clausula (min. 5 characters)."
            onInput={inputHandler}
            initialValue={loadedPlayer.clausula}
            initialValid={true}
          />
          <Button type="submit" disabled={!formState.isValid}>
            UPDATE PLAYER
          </Button>
        </form>
      )}
    </React.Fragment>
  );
};

export default UpdatePlayer;
