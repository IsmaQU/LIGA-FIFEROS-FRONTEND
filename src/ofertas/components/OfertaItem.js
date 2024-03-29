import React, { useState, useContext } from "react";
import "./OfertaItem.css";
import Avatar from "../../shared/components/UIElements/Avatar";
import Card from "../../shared/components/UIElements/Card";
import Button from "../../shared/components/FormElements/Button";
import Modal from "../../shared/components/UIElements/Modal";
import { useHttpClient } from "../../shared/hooks/http-hook";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import { AuthContext } from "../../shared/context/auth-context";

const OfertaItem = (props) => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const addingMiliseconds = 1324;

  const cancelDeleteHandler = () => {
    setShowConfirmModal(false);
    setShowRechazarModal(false);
  };
  const showDeleteWarningHandler = () => {
    setShowConfirmModal(true);
  };
  const showRechazarWarningHandler = () => {
    setShowRechazarModal(true);
  };
  const confirmOfertaHandler = async () => {
    setShowConfirmModal(false);
    try {
      const responsePresupuestoUser = await sendRequest(
        process.env.REACT_APP_BACKEND_URL + "/users"
      );
      const PresupuestoUser = responsePresupuestoUser.users
        .filter((user) => user.id === auth.userId)
        .map((user) => user.presupuesto);
      const responsePresupuestoCreator = await sendRequest(
        process.env.REACT_APP_BACKEND_URL + "/users"
      );
      const PresupuestoCreator = responsePresupuestoCreator.users
        .filter((user) => user.id === props.ofertanteId)
        .map((user) => user.presupuesto);
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/users/pagarclausula/${auth.userId}`,
        "PATCH",
        JSON.stringify({
          presupuesto: Number(PresupuestoUser) + props.cantidad,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/users/pagarclausula/${props.ofertanteId}`,
        "PATCH",
        JSON.stringify({
          presupuesto: Number(PresupuestoCreator) - props.cantidad,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      const responsePlayer = await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/players/get/${props.playerId}`
      );
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/players/${props.playerId}`,
        "DELETE",
        null,
        {
          Authorization: "Bearer " + auth.token,
        }
      );
      const now = Date.now();
      const Expires = now + addingMiliseconds;
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/players/${props.playerId}`,
        "POST",
        JSON.stringify({
          title: responsePlayer.player.title,
          clausula: props.cantidad,
          address: responsePlayer.player.address,
          image: responsePlayer.player.image,
          Expires: Expires,
          clausulaInicial: responsePlayer.player.clausulaInicial,
          team: props.equipoOfertante,
          escudo: props.escudoOfertante,
          creatorName: props.nombreOfertante,
          creator: props.ofertanteId,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );

      const date = new Date();
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();

      await sendRequest(
        process.env.REACT_APP_BACKEND_URL + "/messages/post",
        "POST",
        JSON.stringify({
          TransferMessage: `${props.nombreOfertante} (${
            props.equipoOfertante
          }) ha comprado a ${responsePlayer.player.title} a ${auth.userName} (${
            auth.userTeam
          }) por ${props.cantidad} monedas. ${day}/${
            month < 10 ? "0" + month : month
          }/${year} ${hour < 10 ? "0" + hour : hour}:${
            minutes < 10 ? "0" + minutes : minutes
          }:${seconds < 10 ? "0" + seconds : seconds}`,
        }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      /* const userHasOffers = await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/ofertas/get/receivedOffers/${auth.userId}`
      );

      var existing = localStorage.getItem("userData");
      existing = JSON.parse(existing);
      existing.hasOffers = userHasOffers;
      localStorage.setItem("userData", JSON.stringify(existing)); */

      props.onDeletePlayer(props.playerId);
    } catch (err) {}
  };
  const confirmRechazarHandler = async () => {
    setShowRechazarModal(false);
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/ofertas/${props.id}`,
        "DELETE",
        null,
        {
          Authorization: "Bearer " + auth.token,
        }
      );
      /* const userHasOffers = await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/ofertas/get/receivedOffers/${auth.userId}`
      );

      var existing = localStorage.getItem("userData");
      existing = JSON.parse(existing);
      existing.hasOffers = userHasOffers;
      localStorage.setItem("userData", JSON.stringify(existing)); */

      props.onDelete(props.id);
    } catch (err) {}
  };
  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}

      <Modal
        show={showConfirmModal}
        onCancel={cancelDeleteHandler}
        header="¿Seguro que quieres aceptar la oferta?"
        footerClass="place-item__modal-actions"
        footer={
          <React.Fragment>
            <Button inverse onClick={cancelDeleteHandler}>
              NO
            </Button>
            <Button danger onClick={confirmOfertaHandler}>
              SÍ
            </Button>
          </React.Fragment>
        }
      ></Modal>
      <Modal
        show={showRechazarModal}
        onCancel={cancelDeleteHandler}
        header="¿Seguro que quieres rechazar la oferta?"
        footerClass="place-item__modal-actions"
        footer={
          <React.Fragment>
            <Button inverse onClick={cancelDeleteHandler}>
              NO
            </Button>
            <Button danger onClick={confirmRechazarHandler}>
              SÍ
            </Button>
          </React.Fragment>
        }
      ></Modal>
      <li className="offer-item">
        <Card className="offer-item__content">
          <div className="offer-item__image">
            <Avatar
              image={props.escudoOfertante}
              alt={props.equipoOfertante}
            ></Avatar>
          </div>
          <div className="offer-item__info">
            <div className="main-info">
              <h2>{props.equipoOfertante}</h2>
              <h4>{props.nombreOfertante}</h4>
            </div>
            <div className="money-item">
              <h3>{props.cantidad} </h3>
              <img
                src={require("../../icons/sinchronize-xxl.png")}
                alt={props.clausula}
              ></img>
            </div>
            <div className="buttons">
              <Button onClick={showDeleteWarningHandler}>ACEPTAR</Button>
              <Button onClick={showRechazarWarningHandler}>RECHAZAR</Button>
            </div>
          </div>
        </Card>
      </li>
    </React.Fragment>
  );
};

export default OfertaItem;
