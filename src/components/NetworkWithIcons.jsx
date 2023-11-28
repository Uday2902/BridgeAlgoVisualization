import React, { useEffect, useRef, useState } from "react";
import Graph from "react-vis-network-graph";
import Grid from "@mui/material/Grid";
import nodeData from "../assets/data.json";
import { Button } from "@mui/material";
import axios from "axios";

function NetworkWithIcons() {
  const graphRef = useRef(null);
  const [datas, setDatas] = useState("--");
  const [router, setRouter] = useState(1);
  const [port, setPort] = useState(1);
  const [hub, setHub] = useState(1);
  const [pc, setPc] = useState(1);
  const [lan, setLan] = useState(1);
  const [laptop, setLaptop] = useState(1);
  const [bridge, setBridge] = useState(2);
  const [currentSelection, setCurrentSelection] = useState(0);
  const [connectionQueue, setConnectionQueue] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [disabledAddEdgeButton, setDisabledAddEdgeButton] = useState(false);
  const [disabledSendPacketButton, setDisabledSendPacketButton] =
    useState(false);
  const [startAnimation, setStartAnimation] = useState(0);
  const [logs, setLogs] = useState([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const colorInterval = 2000;
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [srcDstSelecting, setSrcDstSelecting] = useState(false);
  const [currentSrcDstSelection, setCurrentSrcDstSelection] = useState(0);
  const [srcDstConnectionQueue, setSrcDstConnectionQueue] = useState([]);
  const [disabledSrcDstSelectionButton, setDisabledSrcDstSelectionButton] = useState(false);
  const [animationObject, setAnimationObject] = useState([]);
  const [rows, setRows] = useState([]);
  const [currentDoneReset, setCurrentDoneReset] = useState("Done");
  const [nonSelectedEdges, setNonSelectedEdges] = useState([]);
  const [bridgeTablesToSendToBackend, setBridgeTablesToSendToBackend] = useState({});
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [instruction, setInstruction] = useState("");
  const [bridgeTables, setBridgeTables] = useState({
    B1: "",
  });
  const [ports, setPorts] = useState({ B1: 0 });
  const _data = {
    nodes: [
      {
        id: "B1",
        name: "Bridge",
        shape: "image",
        image: "https://i.ibb.co/5MbJ5kp/bridge.jpg",
        size: 15,
        label: "Bridge-1",
      },
    ],
    edges: [],
  };
  const [data, setData] = useState(_data);

  const options = {
    interaction: {
      selectable: true,
      hover: true,
    },
    manipulation: {
      enabled: false,
      initiallyActive: true,
      addNode: false,
      addEdge: false,
      editEdge: false,
      deleteNode: false,
      deleteEdge: false,
    },
    edges: {
      width: 3,
      arrows: {
        to: {
          enabled: false,
        },
      },
    },
  };

  function myFunction() {
    // console.log("Icon image clicked!");
  }

  const handleStartAnimationClick = async () => {
    const dataToSend = {
      selectedEdges: selectedEdges,
      nonSelectedEdges: nonSelectedEdges,
      nodes: data.nodes,
      bridgeTables: bridgeTablesToSendToBackend,
      sender: source,
      receiver: destination,
    };

    console.log("Datatosend to backend on /forward - ", dataToSend);

    await axios
      .post("http://127.0.0.1:5000/forward", dataToSend)
      .then((response) => {
        console.log("response from /forward - ", response);
        setAnimationObject(response.data.forwardTable);
        setBridgeTablesToSendToBackend(response.data.bridgeTables);
        setBridgeTables(response.data.frontendTables);
        setMessageIndex(0);
        setStartAnimation((prev) => prev + 1);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    const updatedEdges = data.edges.map((edge) => {
      const matchingEdge = nonSelectedEdges.find(
        (e) =>
          (e.from === edge.from && e.to === edge.to) ||
          (e.from === edge.to && e.to === edge.from)
      );

      if (matchingEdge) {
        return { ...edge, color: "#6b6d6e" };
      }

      return edge;
    });

    setData((prevGraph) => ({
      ...prevGraph,
      edges: updatedEdges,
    }));
  }, [nonSelectedEdges]);

  useEffect(() => {
    if (currentSrcDstSelection === 0 && srcDstSelecting) {
      setInstruction("Select Source");
    } else if (currentSrcDstSelection === 1) {
      setInstruction("Select Destination");
    } else if (currentSrcDstSelection === 0 && !srcDstSelecting) {
      setInstruction("");
    }
  }, [currentSrcDstSelection, srcDstSelecting]);

  const handleNodeClick = async (event) => {
    if (srcDstSelecting) {
      //   console.log("selecting src dst");
      if (event.nodes.length > 0 && currentSrcDstSelection === 0) {
        setCurrentSrcDstSelection(1);
        // console.log("connection queue", connectionQueue, event.nodes[0]);
        setSrcDstConnectionQueue([event.nodes[0]]);
        // console.log("connection queue", connectionQueue);
      } else if (currentSrcDstSelection === 1 && event.nodes.length > 0) {
        setSource(srcDstConnectionQueue[0]);
        setDestination(event.nodes[0]);
        setSrcDstConnectionQueue([]);
        setCurrentSrcDstSelection(0);
        setDisabledSrcDstSelectionButton(false);
        setSrcDstSelecting(false);
      }
    } else if (isSelecting) {
      //   console.log("currentSelection", currentSelection);
      if (event.nodes.length > 0 && currentSelection === 0) {
        setCurrentSelection(1);
        // console.log("connection queue", connectionQueue, event.nodes[0]);
        setConnectionQueue([event.nodes[0]]);
        // console.log("connection queue", connectionQueue);
      } else if (currentSelection === 1 && event.nodes.length > 0) {
        // console.log("connection queue", connectionQueue);
        if (
          event.nodes[0].slice(0, 1) === "P" &&
          connectionQueue[0].slice(0, 1) === "B"
        ) {
          setData((prevData) => {
            const updatedNodes = [...prevData.nodes];
            const nodeIndexToUpdate = updatedNodes.findIndex(
              (node) => node.id === event.nodes[0]
            );

            if (nodeIndexToUpdate !== -1) {
              // Update the label of the node with the Port information
              updatedNodes[nodeIndexToUpdate] = {
                ...updatedNodes[nodeIndexToUpdate],
                label: `Port-${ports[connectionQueue[0]] + 1}`,
              };
              setPorts((prev) => ({
                ...prev,
                [connectionQueue[0]]: prev[connectionQueue[0]] + 1,
              }));
            }
            return {
              nodes: updatedNodes,
              edges: [
                ...prevData.edges,
                {
                  from: connectionQueue[0],
                  to: event.nodes[0],
                  color: "#017a8f",
                },
              ],
            };
          });
        } else if (
          event.nodes[0].slice(0, 1) === "B" &&
          connectionQueue[0].slice(0, 1) === "P"
        ) {
          setData((prevData) => {
            const updatedNodes = [...prevData.nodes];
            const nodeIndexToUpdate = updatedNodes.findIndex(
              (node) => node.id === connectionQueue[0]
            );

            if (nodeIndexToUpdate !== -1) {
              updatedNodes[nodeIndexToUpdate] = {
                ...updatedNodes[nodeIndexToUpdate],
                label: `Port-${ports[event.nodes[0]] + 1}`,
              };
              setPorts((prev) => ({
                ...prev,
                [event.nodes[0]]: prev[event.nodes[0]] + 1,
              }));
            }
            return {
              nodes: updatedNodes,
              edges: [
                ...prevData.edges,
                {
                  from: connectionQueue[0],
                  to: event.nodes[0],
                  color: "#017a8f",
                },
              ],
            };
          });
        } else {
          setData((prevData) => ({
            nodes: [...prevData.nodes],
            edges: [
              ...prevData.edges,
              {
                from: connectionQueue[0],
                to: event.nodes[0],
                color: "#017a8f",
              },
            ],
          }));
        }

        // Disabled -> 6b6d6e
        // Normal -> 017a8f
        // Packet sending -> 00ff1d
        setConnectionQueue([]);
        setCurrentSelection(0);
        setDisabledAddEdgeButton(false);
        setIsSelecting(false);
      }
      //   console.log(event);
      setDatas(event.nodes[0]);
    } else {
      //   console.log(event);
    }
  };

  const handleAddEdgeClick = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setDisabledAddEdgeButton(false);
    } else {
      setIsSelecting(true);
      setDisabledAddEdgeButton(true);
    }
  };

  const handleSrcDstSelectionClick = () => {
    if (srcDstSelecting) {
      setSrcDstSelecting(false);
      setDisabledSrcDstSelectionButton(false);
    } else {
      setSrcDstSelecting(true);
      setDisabledSrcDstSelectionButton(true);
    }
  };

  useEffect(() => {
    if (currentSelection === 0) {
      setIsSelecting(false);
    }
  }, [currentSelection]);

  useEffect(() => {
    if (currentSrcDstSelection === 0) {
      setSrcDstSelecting(false);
    }
  }, [currentSrcDstSelection]);

  useEffect(() => {
    // console.log(source, destination);
  }, [source, destination]);

  useEffect(() => {
    // console.log(startAnimation);
  }, [startAnimation]);

  useEffect(() => {
    if (startAnimation) {
      const intervalId = setInterval(() => {
        if (messageIndex < animationObject.length) {
          const currentStep = animationObject[messageIndex];
          const fromNodes = Object.keys(currentStep);
          let updatedEdges = [...data.edges];
          fromNodes.forEach((fromNode) => {
            const toNodes = currentStep[fromNode];
            // console.log("Fromnode - ", fromNode, "Tonode - ", toNodes);
            setLogs((prev) => [...prev, { from: fromNode, to: toNodes }]);
            const edgesToUpdate = data.edges.filter(
              (edge) =>
                (edge.from === fromNode && toNodes.includes(edge.to)) ||
                (toNodes.includes(edge.from) && edge.to === fromNode)
            );
            // console.log("edgestoupdate -> ", edgesToUpdate);
            // Update updatedEdges inside the loop
            updatedEdges = updatedEdges.map((edge) => {
              if (
                edgesToUpdate.find(
                  (e) => e.from === edge.from && e.to === edge.to
                )
              ) {
                // console.log("EDGE -->> ", edge);
                return { ...edge, color: "#00ff1d" };
              } else {
                return edge;
              }
            });
          });
          //   console.log("updatededges -> ", updatedEdges);
          setData((prevGraph) => ({
            ...prevGraph,
            edges: updatedEdges,
          }));
          setMessageIndex(messageIndex + 1);
        } else {
          clearInterval(intervalId);
          // Reset edges to black
          const resetEdges = data.edges.map((edge) => ({
            ...edge,
            color: edge.color === "#6b6d6e" ? "#6b6d6e" : "017a8f",
          }));

          console.log("non", nonSelectedEdges);

          setData((prevGraph) => ({
            ...prevGraph,
            edges: resetEdges,
          }));
        }
      }, colorInterval);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [startAnimation, messageIndex, animationObject, colorInterval]);

  useEffect(() => {
    let tempRows = [];
    Object.keys(bridgeTables).forEach((bridge) => {
      const ports = bridgeTables[bridge];
      if (ports) {
        Object.keys(ports).forEach((port, index) => {
          console.log(bridge, port, index);
          const rowData = {
            bridge: index === 0 ? `Bridge-${bridge.slice(1, 2)}` : "",
            port: port.slice(0, 2),
            components: ports[port]
              .map((device) => `PC-${parseInt(device.match(/\d+/), 10)}`)
              .join(", "),
          };
          tempRows.push(rowData);
        });
      }
    });
    setRows(tempRows);
  }, [bridgeTables]);

  const handleCurrentDoneResetClick = async () => {
    if (currentDoneReset === "Done") {
      setCurrentDoneReset("Reset");
      setDisabledAddEdgeButton(true);
      await axios
        .post("http://127.0.0.1:5000/mst", data)
        .then((response) => {
          console.log("Response from MST - ", response);
          setBridgeTablesToSendToBackend(response.data.bridgeTables);
          setNonSelectedEdges(response.data.nonSelectedEdges);
          setSelectedEdges(response.data.selectedEdges);
        })
        .catch((err) => console.log(err));
    } else if (currentDoneReset === "Reset") {
      setCurrentDoneReset("Done");
      setDisabledAddEdgeButton(false);
    }
  };

  function handleLogs(item) {
    if (!Array.isArray(item)) {
      switch (item.slice(0, 1)) {
        case "H":
          return `Hub-${item.slice(1, 2)}`;
        case "P":
          return `Port-${item.slice(1, 2)}`;
        case "D":
          return `PC-${item.slice(1, 2)}`;
        case "L":
          return `LAN-${item.slice(1, 2)}`;
        case "B":
          return `Bridge-${item.slice(1, 2)}`;
        default:
          return item;
      }
    } else {
      return item.map((item) => {
        switch (item.slice(0, 1)) {
          case "H":
            return `Hub-${item.slice(1, 2)}`;
          case "P":
            return `Port-${item.slice(1, 2)}`;
          case "D":
            return `PC-${item.slice(1, 2)}`;
          case "L":
            return `LAN-${item.slice(1, 2)}`;
          case "B":
            return `Bridge-${item.slice(1, 2)}`;
          default:
            return item;
        }
      });
    }
  }

  useEffect(() => {
    // console.log("bridgeTablesToSendToBackend - ", bridgeTablesToSendToBackend);
    // console.log("nonSelectedEdges", nonSelectedEdges);
    // console.log("selectedEdges", selectedEdges);
  }, [bridgeTablesToSendToBackend, selectedEdges]);

  return (
    <>
      <Grid>
        <Grid item style={{ marginTop: "1rem" }}>
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "40%",
                justifyContent: "space-between",
                marginLeft: "1.02rem",
              }}
            >
              {nodeData.nodes.map((el) => {
                return (
                  <span
                    key={el.id}
                    style={{
                      borderRadius: "20%",
                      width: "60px",
                      margin: "0.4rem 0 1rem 0",
                    }}
                  >
                    {el.label}
                  </span>
                );
              })}
            </div>
            <div
              style={{
                position: "absolute",
                left: "45%",
                top: "9%",
                fontSize: "1.5rem",
              }}
            >
              {instruction !== "" ? instruction + " ..." : ""}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "40%",
              }}
            >
              {nodeData.nodes.map((el) => {
                return (
                  <div
                    draggable={true}
                    key={el.id}
                    data-label={el.label}
                    data-name={el.name}
                    data-image={el.image}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      borderRadius: "20%",
                      width: "60px",
                      height: "60px",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onDragEnd={() => {
                      const newElement = {
                        id: el.id,
                        name: el.name,
                        shape: "image",
                        image: el.image,
                        size: 15,
                        label: el.id,
                      };

                      // Determine the element type and update the count
                      if (el.name === "Router") {
                        newElement.id = `R${router}`;
                        newElement.label = `Router-${router}`;
                        setRouter((prev) => prev + 1);
                      } else if (el.name === "PC") {
                        newElement.id = `D${pc}`;
                        newElement.label = `PC-${pc}`;
                        setPc((prev) => prev + 1);
                      } else if (el.name === "Laptop") {
                        newElement.id = `Laptop-${laptop}`;
                        newElement.label = `Laptop-${laptop}`;
                        setLaptop((prev) => prev + 1);
                      } else if (el.name === "Hub") {
                        newElement.id = `H${hub}`;
                        newElement.label = `Hub-${hub}`;
                        setHub((prev) => prev + 1);
                      } else if (el.name === "Bridge") {
                        newElement.id = `B${bridge}`;
                        newElement.label = `Bridge-${bridge}`;
                        setBridge((prev) => prev + 1);
                        setPorts((prev) => ({
                          ...prev,
                          [newElement.id]: 0,
                        }));
                      } else if (el.name === "Port") {
                        newElement.id = `P${port}`;
                        newElement.label = `Port-${port}`;
                        setPort((prev) => prev + 1);
                      } else if (el.name === "LAN") {
                        newElement.id = `L${lan}`;
                        newElement.label = `LAN-${lan}`;
                        setLan((prev) => prev + 1);
                      }

                      setData({
                        nodes: [...data.nodes, newElement],
                        edges: [...data.edges],
                      });
                    }}
                  >
                    <img
                      alt="Not available"
                      src={el.image}
                      width="90%"
                      height="80%"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Grid>
        <Grid item>
          <div style={{ display: "flex", marginTop: "0.5rem" }}>
            <div
              onClick={handleAddEdgeClick}
              style={{
                margin: "0.4rem",
              }}
            >
              <Button variant="contained" disabled={disabledAddEdgeButton}>
                Add Edge
              </Button>
            </div>
            <div
              onClick={handleStartAnimationClick}
              style={{
                margin: "0.4rem",
              }}
            >
              <Button variant="contained" disabled={disabledSendPacketButton}>
                Start Animation
              </Button>
            </div>
            <div
              onClick={handleSrcDstSelectionClick}
              style={{
                margin: "0.4rem",
              }}
            >
              <Button
                variant="contained"
                disabled={disabledSrcDstSelectionButton}
              >
                Select Src & Dst
              </Button>
            </div>
            <div
              onClick={handleCurrentDoneResetClick}
              style={{
                margin: "0.4rem",
              }}
            >
              <Button variant="contained">{currentDoneReset}</Button>
            </div>
          </div>
        </Grid>
        <Grid
          item
          md={7}
          style={{ display: "flex", margin: "1rem", height: "100vh" }}
        >
          <div style={{ flex: "1", fontSize: "12px" }}>
            <div
              style={{
                height: "48%",
                margin: "0.3rem",
                borderRadius: "8px",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                overflowY: "scroll",
                overflowX: "hidden",
              }}
            >
              {logs.length <= 0 ? (
                <p
                  style={{
                    fontSize: "1.5rem",
                    marginTop: "9.5rem",
                    marginLeft: "6rem",
                  }}
                >
                  Logs
                </p>
              ) : (
                logs.map((currentLog) =>
                  currentLog.to.length !== 0 ? (
                    <div
                      style={{
                        width: "95%",
                        height: "3rem",
                        textAlign: "center",
                        borderBottom: "1px solid #ecf0f1",
                        padding: "0.5rem",
                        margin: "0.5rem",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#2c3e50",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        backgroundColor: "#ecf0f1",
                        borderRadius: "5px",
                      }}
                    >
                      <span>
                        From: {handleLogs(currentLog.from)}
                        <br /> To:{" "}
                        {Array.isArray(currentLog.to)
                          ? handleLogs(currentLog.to).join(", ")
                          : handleLogs(currentLog.to)}
                      </span>
                    </div>
                  ) : null
                )
              )}
            </div>

            <div
              style={{
                height: "48%",
                margin: "0.3rem",
                borderRadius: "8px",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "scroll",
              }}
            >
              {bridgeTables.B1 === "" ? (
                <p style={{ fontSize: "1.5rem" }}>Bridge Learning Table</p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "10px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          backgroundColor: "#f2f2f2",
                        }}
                      >
                        Bridge
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          backgroundColor: "#f2f2f2",
                        }}
                      >
                        Port
                      </th>
                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          backgroundColor: "#f2f2f2",
                        }}
                      >
                        Connected Components
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td
                          style={{ border: "1px solid #ddd", padding: "8px" }}
                        >
                          {row.bridge}
                        </td>
                        <td
                          style={{ border: "1px solid #ddd", padding: "8px" }}
                        >
                          {row.port}
                        </td>
                        <td
                          style={{ border: "1px solid #ddd", padding: "8px" }}
                        >
                          {row.components}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div
            style={{
              flex: "4",
              borderRadius: "8px",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Graph
              graph={data}
              ref={graphRef}
              options={options}
              events={{
                click: handleNodeClick,
              }}
              getNetwork={(network) => {
                network.on("afterDrawing", (ctx) => {
                  data.nodes.forEach((node) => {
                    const iconImg = new Image();
                    // iconImg.src =
                    //   "https://www.iconarchive.com/download/i22783/kyo-tux/phuzion/Sign-Info.ico";
                    const nodeId = node.id;
                    const nodePosition = network.getPositions([nodeId])[nodeId];
                    // // console.log("Hellll000", nodePosition, nodeId);
                    const nodeSize = 20;
                    var setVal = sessionStorage.getItem("set");
                    if (setVal === "yes") {
                      // // console.log(setVal);
                      ctx.font = "14px Arial";
                      ctx.fillStyle = "#000000";
                      ctx.textAlign = "center";
                      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                      ctx.shadowBlur = 5;
                      ctx.fillStyle = "#ffcc00";
                      ctx.fillRect(
                        nodePosition.x + nodeSize + 2,
                        nodePosition.y + nodeSize - 20,
                        50,
                        20
                      );
                      ctx.fillText(
                        node.label,
                        nodePosition.x,
                        nodePosition.y + nodeSize + 20
                      );
                      ctx.font = "12px Arial";
                      ctx.color = "black";
                      ctx.fillStyle = "black";
                      ctx.textAlign = "left";
                      ctx.fillText(
                        node.cost,
                        nodePosition.x + nodeSize + 5,
                        nodePosition.y + nodeSize - 5
                      );
                    } else if (setVal === "no") {
                      // // console.log(setVal);
                      const iconWidth = 20; // width of the icon image
                      const iconHeight = 16;
                      // iconImg.src =
                      //   "https://www.iconarchive.com/download/i22783/kyo-tux/phuzion/Sign-Info.ico";
                      ctx.font = "14px Arial";
                      ctx.fillStyle = "#000000";
                      ctx.textAlign = "center";
                      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                      ctx.shadowBlur = 5;
                      ctx.fillStyle = "#ffcc00";
                      ctx.drawImage(
                        iconImg,
                        nodePosition.x + nodeSize + 5,
                        nodePosition.y + nodeSize + 5,
                        iconWidth,
                        iconHeight
                      );
                      iconImg.addEventListener(
                        "mouseover",
                        myFunction,
                        "false"
                      );
                    }
                  });
                });
              }}
              style={{ display: "flex", height: "40rem" }}
            />
          </div>
        </Grid>
      </Grid>
    </>
  );
}


export default NetworkWithIcons;