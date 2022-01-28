import 'bootstrap/dist/css/bootstrap.min.css'; //IMPORTANTE -> IMPORTARE
import {
    Row,
    Col,
    Container,
    NavDropdown,
    Nav,
    Navbar,
    Button,
    Offcanvas,
    Form
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
//import { HotKeys } from "react-hotkeys"; //-> per shortcut
import useUndoable from "use-undoable";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow,
{
    removeElements,
    addEdge,
    Controls,
    ControlButton,
    Background,
    useZoomPanHelper,
    useStoreState,
    useStoreActions,
    useUpdateNodeInternals,
} from 'react-flow-renderer';
import _ from 'lodash'; // for count element objects -> shortuct _
import Sidebar_t from './Sidebar_theater'; // per la sidebar
import DataNodeInfo_t from './DataNodeInfo_theater';
import '../all.css'
import AllTypeNodes from '../../nodes/AllTypeNodes';
import grid_dot from '../../images/nodeimg/grid_dot.png';
import grid_line from '../../images/nodeimg/grid_line.png';
import grid_no from '../../images/nodeimg/grid_no.png';
import save from '../../images/nodeimg/savedisk.png';
import restore from '../../images/nodeimg/restore.png';
import zoomin from '../../images/nodeimg/zoom_in.png';
import zoomout from '../../images/nodeimg/zoom_out.png';
import fitview from '../../images/nodeimg/fit_view.png';
import menu from '../../images/nodeimg/menu.png';
import indietro from '../../images/nodeimg/undo.png';
import avanti from '../../images/nodeimg/redo.png';
import deletex from '../../images/nodeimg/delete.png';
import selall from '../../images/nodeimg/select_all.png';

import { useSelector, useDispatch } from 'react-redux';

import localforage from 'localforage';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * SETTINGS PER LOCALFORAGE
*/
localforage.config({
    name: 'react-flow-docs',
    storeName: 'flows',
});
const flowKey = 'example-flow'; // chiave per reperire i dati


/* @ function per generare nuovo id random -> fatto corrispondere con le iniziali dell'idge*/
/* INFO PER REPERIRE I DATI DAL JSON
    EDGE = reactflow__edge
    NODE = reactflow__node
*/
const getNodeId = () => `reactflow__node-${+new Date()}`;

/* @ operazioni per reperire stili e classi dei nodi base */
const ATN = new AllTypeNodes();
const allNodeTypes = ATN.GetObj();

// set elementi iniziali
// const ElementiIniziali = [

//     {
//         id: getNodeId(),
//         type: 'server',
//         position: { x: 100, y: 200 },
//         data: { label: ' server_prova ', desc: " info_server " }, //text != lable in special/custom type
//     },
//     {
//         id: getNodeId() + 1,
//         type: 'port',
//         position: { x: 400, y: 200 },
//         data: { label: ' port_prova ', desc: " info_port " }, //text != lable in special/custom type
//     },
//     {
//         id: getNodeId() + 2,
//         type: 'network',
//         position: { x: 400, y: 0 },
//         data: { label: ' net_prova ', desc: " info_net " }, //text != lable in special/custom type
//     },
//     {
//         id: getNodeId() + 3,
//         type: 'subnet',
//         position: { x: 100, y: 0 },
//         data: { label: ' sub_prova ', desc: " info_sub " }, //text != lable in special/custom type
//     },

// ];







const FlowApp_t = (props) => {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /** @STATE -> observable
     *  Per reperire i dati principali
     */
    const [state, setState] = useState({ type: props.type, name: props.name, description: props.description, version: props.version })

    /*  @STATE -> observable
        Per l'istanza del modello react (valorizzata all'avvio)
        con il metodo associato setIstanzaReactFlow() per la manipolazione,
    */
    const [IstanzaReactFlow, setIstanzaReactFlow] = useState();

    /* @STATE -> observable
        Per gli elementi da aggiungere (valorizzata all'avvio)
        con il metodo associato setIstanzaReactFlow() per la manipolazione,
    */
    //const [elementi, setElementi] = useState(ElementiIniziali);
    const [elementi, setElementi, { undo, canUndo, redo, canRedo }] = useUndoable([]);
    //([]) -> SE VUOTO
    //(ElementiIniziali) -> SE CON QUALCHE PLACE HOLDER
    // const { transform } = useZoomPanHelper();

    /** @STATE -> observable
        Per aprire la schermata delle info una volta eseguito il drop del nodo
     */
    const [datanodeinfo, setDNI] = useState({ selected_element: undefined, show: false })

    /** @STATES -> observables
     *  Per aggiornare le dimenzioni del canvas e della side dei dati dei nodi.
     */
    const [dim_canvas, setDimCanvas] = useState(10);
    const [dim_sider, setDimSider] = useState(0);

    /** @STATE -> observable
     *  Per controllare e aggiornare lo stile background
     */
    const [bkgnd, updateBackground] = useState({ type: 'lines', img: grid_dot, gap: 12, size: 1.5 });


    /** @STATE -> observable
     *  Per aggiornare la view per DNI al side dx.
     */
    const [disp, setDisplay] = useState('none')

    /** HOOKS for zoom properties
     *  usato per le funzioni zoom
    */
    const { zoomIn, zoomOut, fitView } = useZoomPanHelper();

    /**
     * PER FAR FUNZIONARE LE FUNZIONI selectAll e addFootBar
     */
    const nodes = useStoreState((store) => store.nodes);
    const transform = useStoreState((store) => store.transform);
    const setSelectedElements = useStoreActions((actions) => actions.setSelectedElements);

    /**
     * PER REPERIRE I DATI SALVATI
     */
    const dispatch = useDispatch();

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @function onElementsRemove
     * @param {*} elementsToRemove
     *   Selezionati gli elementi da rimuovere
     * @description
     *  Function assegnata ad ogni eliminazione degli elementi.
             richiama setElementi -> che modifica gli elementi nel canvas (nodi e archi).
             che richama removeElements() che prende gli elementi da eliminare e li rimuove dal canvas.
     */
    function onElementsRemove(elementsToRemove) {
        setElementi((els) => removeElements(elementsToRemove, els));
    }

    /**
     * @function onConnect
     * @param {*} params
     *  Selezionati i nodi 'from' e 'to'
     * @description
     *  Function assegnata ad ogni connessione tramite collegamento.
     *      richiama setElementi -> che modifica gli elementi nel canvas (nodi e archi).
     *      che richiama addEdge() che permette di aggiungere un arco di collegmento al canvas.
     */
    function onConnect(params) {
        //console.log('we',params);
        setElementi((els) => addEdge(params, els));
        //setElementi((els) => addEdge({ ...params, type: "smoothstep" }, els)); //Se si vuole smoothstep.
    }

    /**
     * @function onSave
     * @description
     *  Questa funzione serve per salvare i dati. https://it.reactjs.org/docs/hooks-reference.html#usecallback
     *      Se l'istanza è attiva ed è vera (c'è qualcosa),
     *      trasforma l'istanzaReactFlow in un oggetto [toObject] (per poterlo memorizzare, anche in json)
     *      lo memorizza in localforage in $$$$.
     */
    const onSave = useCallback(() => {
        if (IstanzaReactFlow) {
            const flow = IstanzaReactFlow.toObject(); //converte il diagramma in oggetto
            console.log(_.size(flow.elements), "elements in diagram"); // uso '_' libreria
            flow['#elements'] = _.size(flow.elements); // detrae il numero dei nodi.
            flow['theater_name'] = state.name;
            flow['theater_description'] = state.description;
            flow['theater_version'] = '1.0'; //TODO
            //flow['theater_sessions'] = []; //TODO
            flow['areas'] = areas; //TODO
            localforage.setItem(flowKey, flow); // @@@@ salva gli elementi trasformati in obj reperibili con la chiave specificata
            console.log(JSON.stringify(flow)); // salva il json
        } else {
            console.log("error saving diagram!");
        }
    }, [IstanzaReactFlow]);

    /**
     * @function onRestore
     * @description
     *  Questa funzione serve per ripristinare i dati. https://it.reactjs.org/docs/hooks-reference.html#usecallback
     *      Prende i dati da localforage in $$$$ con la chiave flowkey
     *      e se ci sono dati, richiama setElementi che mofifica gli elementi del canvas (nodi e archi),
     *      e li inserisce/aggiorna le loro poisizioni in base egli elementi reperiti in $$$$
     */
    const onRestore = useCallback(() => {
        const restoreFlow = async () => {
            const flow = await localforage.getItem(flowKey); // @@@@ rinviene gli elementi salvati (in obj) usando la chiave
            if (flow) {
                //const [x = 0, y = 0] = flow.position;
                setElementi(flow.elements || []); // aggiora/modifica/aggiunge nodi e archi nelle posizioni salvate
                //transform({ x, y, zoom: flow.zoom || 0 });
            }
        };
        restoreFlow();
    }, [setElementi]); // aggiongere ",transform"-> per la posizione

    /**
     * @function onAdd
     * @description
     *  Questa funzione serve per aggiungere i nodi. https://it.reactjs.org/docs/hooks-reference.html#usecallback
     *      Prende dei template dei nodi e li aggiunge al canvas attraverso la function setElementi che gestisce i nodi e archi.
     *      prende i nodi template create e li concatena a quelli esistenti
     */
    const onAdd = useCallback(() => {
        // node template
        var px = Math.random() * 10;
        var py = Math.random() * 10;
        var py2 = Math.random() * 10 + py;
        const newNode = [
            {
                id: getNodeId(),
                data: { label: 'nuovo nodo base' },
                position: { x: px, y: py, },
            },
            {
                id: getNodeId() + 1,
                data: { label: 'nuovo nodo special' },
                type: 'special',
                position: { x: py + 1, y: py2, },
            }
        ];
        setElementi((els) => els.concat(newNode)); // @@@@ concatena i nodi creati a quelli presenti
    }, [setElementi]);

    /**
     * @function onDragOver
     * @param {*} event
     *  Paramentro che indica la modalità di trasferimento (trasferimento Drag&Drop variabili)
     * @description
     *  Function richiamta quando si è finito l'operazione di dragging. https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
     *
     */
    function onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    /**
     * @function onDrop
     * @param {*} event
     *  Parametro che indica la modalità di trasferimento (trasferimento Drag&Drop variabili)
     * @description
     *  Funzione richiamata quando si esegue il drop degli elementi.
     *      si prende da event (trasferimento Drag&Drop variabili) le informazioni
     *      si crea un nuovo nodo con queste informazioni
     *      e lo si concatena tramite la setElementi al canvas preesistente.
     */
    function onDrop(event) {
        event.preventDefault();
        if (elementi) {
            // const type = event.dataTransfer.getData('application/reactflow');
            const type = event.dataTransfer.getData("type");
            const name = event.dataTransfer.getData("name");
            const description = event.dataTransfer.getData("description");
            const version = event.dataTransfer.getData("version");
            var topology = event.dataTransfer.getData("topology");
            topology = JSON.parse(topology)
            console.log('arrivaed:', topology);
            if (type === '' || type === null) {
                return;
            }
            const position = IstanzaReactFlow.project({ x: event.clientX - 350, y: event.clientY - 50 });
            const id = getNodeId();
            const newNode = {
                id,
                type,
                position,
                data: { label: name, description: description, version: version, topology: topology },
            };
            setElementi((es) => es.concat(newNode)); // @@@@ aggiunge/concatena il nuovo nodo al canvas dei nodi Elementi
        }
    }

    /**
     * @function onElementClick
     * @param {*} event
     *  Cattura evento mouse
     * @param {*} selected_element
     *  Elemento selezionato
     * @description
     *  Quando si clicca un elemento -> cosa fare
     */
    function onElementClick(event, selected_element) {
        //updateNodeInternals(selected_element.id);
        // se è un nodo non fare nulla
        if (selected_element.id.includes('reactflow__edge') /*|| selected_element.type === 'module'*/) {
            /* const ts = { selected_element: selected_element, show: false };
             setDNI(ts); */
            return; // future implementazioni per hp nodi
        }
        console.log('element clicked: ', selected_element);
        const tm = { selected_element: selected_element, show: true };
        setDNI(tm);
        setDimCanvas(6);
        setDimSider(4);
        setDisplay('block'); // MOSTRA LA COLONNA CONTENENTE LE SIDE INFO

        dispatch({ data: selected_element, type: 'selectednode' });
    }


    function onNodeDoubleClick(event, selected_element) {
        console.log('element double clicked: ', selected_element);
        if (selected_element.type === 'module') {
            console.log("azz");
            //onAdd()
        }
        else {
            // const tm = { selected_element: selected_element, show: true };
            // setDNI(tm);
            // setDimCanvas(6);
            // setDimSider(4);
            // setDisplay('block'); // MOSTRA LA COLONNA CONTENENTE LE SIDE INFO
        }
        dispatch({ data: selected_element, type: 'selectednode' });
    }

    /**
     * @function onPaneClick
     * @param {*} event
     *  Cattura evento mouse
     * @description
     *  Quando si clicca un elemento -> cosa fare
     */
    function onPaneClick(event) {
        const tm = { selected_element: '', show: false };
        setDNI(tm);
        setDimCanvas(10);
        setDimSider(0);
        setDisplay('none'); // RIMUOVE LA COLONNA CONTENENTE LE SIDE INFO

    }


    /**
     * @function showDataNode
     * @returns
     *  ritorna un Container (passato al lato dx) contenente tutte le strutture per personalizzare i nodi
     */
    function showDataNode() {
        var d = new DataNodeInfo_t(datanodeinfo);
        return d.renderize();
    }


    /**
     * @function setBackground
     * @description
     *  Praticamente in base al pulsante control premuto aggiorna lo sfondo (e l'immagine del pulsante)
     */
    function setBackground() {
        switch (bkgnd['type']) {
            case 'lines':
                updateBackground({ type: 'dots', img: grid_no, gap: 13, size: 0.5 });
                break;
            case 'dots':
                updateBackground({ type: 'no', img: grid_line, gap: 0, size: 0 });
                break;
            case 'no':
                updateBackground({ type: 'lines', img: grid_dot, gap: 12, size: 1.5 });
                break;
            default:
                break;
        }

    }



    const updateState = (name, desc, version) => {
        var x = { name: name, description: desc, version: version, type: state.type };
        setState(x);
    }

    const [showoc, setShowOC] = useState(false);
    const handleClose = () => setShowOC(false);
    const handleShow = () => setShowOC(true);

    const GetOffcanvas = () => {

        const z_name = useRef(null);
        const z_desc = useRef(null);
        const z_ver = useRef(null);

        const updateDataApp = () => {
            var name = z_name.current.value;
            var desc = z_desc.current.value;
            var ver = z_ver.current.value;
            updateState(name, desc, ver);
        }

        return (
            <Offcanvas show={showoc} onHide={handleClose} style={{ width: '45vw' }}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <h2 className='d-inline mb-3'>
                            {state.name} Info
                        </h2>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <div>
                        <Container className='cf px-1 py-2' style={{ direction: 'ltr', overflowX: 'hidden', overflowY: 'scroll', fontSize: "0.8em", position: 'relative' }}>
                            {/* <Row className='mb-2'>
                                <Col style={{ overflowX: 'auto' }} className='p-2'>
                                    <h2 className='d-inline mb-3'>{this.element['data']['label']}</h2>
                                    <h2 className='d-inline' style={{ fontSize: '1em' }}>{this.tipo} </h2>
                                </Col>
                            </Row> */}

                            {/* NAME */}
                            <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                                <Col xs={12} md={5} lg={4} className='colDNI text-center' >
                                    <Form.Label className="">
                                        <p style={{ whiteSpace: 'nowrap', margin: 'auto', fontSize: '1.7em' }}>
                                            Name {state.type}
                                        </p>
                                    </Form.Label>
                                </Col>
                                <Col xs={12} md={7} lg={8}>
                                    <Form.Control
                                        ref={z_name}
                                        placeholder={state.name}
                                        style={{ fontSize: "1.4em" }}
                                    //onChange={}
                                    />
                                </Col>
                            </Row>

                            {/* DESCRIPTION */}
                            <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                                <Col xs={12} md={5} lg={4} className='colDNI text-center'>
                                    <Form.Label className="">
                                        <p style={{ whiteSpace: 'nowrap', margin: 'auto', fontSize: '1.7em' }}>Description</p>
                                    </Form.Label>
                                </Col>
                                <Col xs={12} md={7} lg={8}>
                                    <Form.Control
                                        ref={z_desc}
                                        /*as='textarea'*/
                                        placeholder={state.description}
                                        style={{ fontSize: "1.4em" }}
                                    //onChange={}
                                    />
                                </Col>
                            </Row>

                            {/* VERSION */}
                            <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                                <Col xs={12} md={5} lg={4} className='colDNI text-center'>
                                    <Form.Label className="">
                                        <p style={{ whiteSpace: 'nowrap', margin: 'auto', fontSize: '1.7em' }}>Version</p>
                                    </Form.Label>
                                </Col>
                                <Col xs={12} md={7} lg={8}>
                                    <Form.Control
                                        ref={z_ver}
                                        /*as='textarea'*/
                                        placeholder={state.version}
                                        style={{ fontSize: "1.4em" }}
                                    //onChange={}
                                    />
                                </Col>
                            </Row>

                            {Areas_node()}

                            <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                                <Col xs={12} md={6} lg={4} className='colDNI text-center'>
                                    <Button variant="primary" onClick={() => updateDataApp()} > Save Changes </Button>
                                </Col>
                                <Col xs={12} md={6} lg={4} className='colDNI text-center'>
                                    <Button variant="danger" onClick={() => handleClose()} > Discard Changes </Button>
                                </Col>
                            </Row>
                        </Container>
                    </div>
                </Offcanvas.Body>
            </Offcanvas >
        );
    }


    const [areas, setAreas] = useState({}); // TO MODIFY INITIAL AREA IN CASE OF IMPORT CHANGE INITIAL STATE IMPORTING THE JSON

    const Areas_node = () => {

        const an = useRef();
        const ad = useRef();

        const updateAreas = () => {
            console.log('new area', an.current.value, ad.current.value)
            var x = {};
            function NEWarea(name, desc) {
                var temp = {
                    $area_name: name,
                    $area_desc: desc
                }
                this.area = temp;
            }
            var y = new Array();
            Object.entries(areas).map(
                ([key, value]) => {
                    y.push(new NEWarea(value.$area_name, value.$area_desc));
                }
            );
            y.push(new NEWarea(an.current.value, ad.current.value));
            Object.entries(y).map(
                ([key, value]) => {
                    var dict = {};
                    dict = value;
                    x[key] = dict;
                }
            );
            setAreas(x);
        }

        const removeArea = (a_name) => {
            for (var k in areas) {
                if (k == a_name) {
                    delete areas[a_name];
                    return true;
                } else if (typeof areas[k] === "object") {
                    if (removeArea(areas[k], a_name)) return true;
                }
            }
            return false;
        }

        function showAreas() {
            Object.entries(areas).map(
                ([key, value]) => {
                    <div id={key}>
                        Area:
                        {/* NAME */}
                        <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                            <Col xs={12} md={5} lg={4} className='colDNI text-center' >
                                <Form.Label className="">
                                    <p style={{ whiteSpace: 'nowrap', margin: 'auto', fontSize: '1.7em' }}>
                                        Area name
                                    </p>
                                </Form.Label>
                            </Col>
                            <Col xs={12} md={7} lg={8}>
                                <Form.Control
                                    //ref={}
                                    placeholder={value.$area_name}
                                    style={{ fontSize: "1.4em" }}
                                //onChange={}
                                />
                            </Col>
                        </Row>
                        {/* DESCRIPTION */}
                        <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                            <Col xs={12} md={5} lg={4} className='colDNI text-center'>
                                <Form.Label className="">
                                    <p style={{ whiteSpace: 'nowrap', margin: 'auto', fontSize: '1.7em' }}>Description</p>
                                </Form.Label>
                            </Col>
                            <Col xs={12} md={7} lg={8}>
                                <Form.Control
                                    //ref={}
                                    /*as='textarea'*/
                                    placeholder={value.$area_desc}
                                    style={{ fontSize: "1.4em" }}
                                //onChange={}
                                />
                            </Col>
                        </Row>

                        <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                            <Col xs={12} md={5} lg={4} className='colDNI text-center'>
                                <Button onClick={() => { removeArea(value.$area_name); console.log('eliminata area:', areas); }}> Remove Area </Button>
                            </Col>
                        </Row>

                    </div>

                }
            )
        }

        const [AddArea, setshowAddArea] = useState({ text: 'Add Area', show: 'none' })
        function switchAddArea() {
            if (AddArea.show === 'none') {
                setshowAddArea({ text: 'Close area creation', show: 'block' });
            } else {
                setshowAddArea({ text: 'Add Area', show: 'none' });
            }
        }

        console.log(areas);
        return (
            <Container className='cf px-1 py-2' style={{ direction: 'ltr', overflowX: 'hidden', overflowY: 'scroll', fontSize: "0.8em", position: 'relative' }}>
                <Row className='mb-2'>
                    <Col style={{ overflowX: 'auto' }} className='p-2'>
                        <h2 className=' mb-3'>Areas:</h2>
                    </Col>
                </Row>

                {showAreas()}

                <Button onClick={() => { switchAddArea() }}> {AddArea.text} </Button>
                <div style={{ display: AddArea.show }}>
                    Add Area:
                    {/* NAME */}
                    <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                        <Col xs={12} md={5} lg={4} className='colDNI text-center' >
                            <Form.Label className="">
                                <p style={{ whiteSpace: 'nowrap', margin: 'auto', fontSize: '1.7em' }}>
                                    Area Name
                                </p>
                            </Form.Label>
                        </Col>
                        <Col xs={12} md={7} lg={8}>
                            <Form.Control
                                ref={an}
                                placeholder={state.name}
                                style={{ fontSize: "1.4em" }}
                            //onChange={}
                            />
                        </Col>
                    </Row>

                    {/* DESCRIPTION */}
                    <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                        <Col xs={12} md={5} lg={4} className='colDNI text-center'>
                            <Form.Label className="">
                                <p style={{ whiteSpace: 'nowrap', margin: 'auto', fontSize: '1.7em' }}>
                                    Description
                                </p>
                            </Form.Label>
                        </Col>
                        <Col xs={12} md={7} lg={8}>
                            <Form.Control
                                ref={ad}
                                /*as='textarea'*/
                                placeholder={state.description}
                                style={{ fontSize: "1.4em" }}
                            //onChange={}
                            />
                        </Col>
                    </Row>

                    <Row className='mb-2 mt-2 justify-content-center rowDNI' >
                        <Col xs={12} md={5} lg={4} className='colDNI text-center'>
                            <Button onClick={() => { updateAreas() }}> Add Area </Button>
                        </Col>
                    </Row>
                </div>

            </Container>
        );
    }




    /**
     * @function getSidebar
     * @returns
     *  This function return a render output of sidebar -> node
     */
    function getSidebar() {
        var x = new Sidebar_t()
        return (x.render());
    }

    function addNavBar() {
        return (
            <Container className='cf sticky-top' style={{ /*maxHeight: '7vh',*/ minHeight: '7vh' }}>
                <Navbar collapseOnSelect expand="lg" bg="light" variant="primary" style={{ minHeight: '7vh', /*maxHeight: '7vh',*/ paddingLeft: '1vw', paddingRight: '1vw' }}>
                    <Navbar.Brand /*href="#home"*/>
                        <h2 className='d-inline mb-3'>
                            {state.name}
                            <cite className='d-inline' style={{ fontSize: '0.5em' }}> {state.type} </cite>
                        </h2>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav">
                        <img src={menu} width={25} height={25} alt="zoomin" style={{ marginBottom: '0.4vh' }} />
                    </Navbar.Toggle>
                    <Navbar.Collapse id="responsive-navbar-nav">

                        <Nav className="me-auto">

                            <Nav.Link onClick={() => handleShow()}>Theater details</Nav.Link>
                            {/* <Nav.Link>Items</Nav.Link>

                            <NavDropdown title="Image details" id="collasible-nav-dropdown">
                                <NavDropdown.Item >1</NavDropdown.Item>
                                <NavDropdown.Item >2</NavDropdown.Item>
                                <NavDropdown.Item >3</NavDropdown.Item>
                                { }
                                <NavDropdown.Divider />
                                <NavDropdown.Item >Add Image</NavDropdown.Item>
                            </NavDropdown> */}

                        </Nav>

                        <Nav>
                            <Nav.Link onClick={() => onSave()}>Save</Nav.Link>
                            <Nav.Link onClick={() => onRestore()}>Restore</Nav.Link>
                            <Nav.Link as={Link} to="/home">Exit</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Navbar>
                {GetOffcanvas()}
            </Container>
        );
    }

    function addSubBar() {
        return (
            <Container className='cf bg-light' style={{ /*maxHeight: '3vh',*/ minHeight: '3vh', paddingLeft: '1vw', paddingRight: '1vw', border: '1px solid gray', }}>

                <Row className="me-auto" >
                    <Col style={{ textAlign: 'left' }}>
                        <a className='btn p-0' onClick={zoomIn} style={{ marginRight: '1vw' }}>
                            <img src={zoomin} width={18} height={18} alt="zoomin" style={{ marginBottom: '0.4vh' }} />
                            Zoom in
                        </a>
                        <a className='btn p-0' onClick={zoomOut} style={{ marginRight: '1vw' }}>
                            <img src={zoomout} width={18} height={18} alt="zoomout" style={{ marginBottom: '0.4vh' }} />
                            Zoom out
                        </a>
                        <a className='btn p-0' onClick={fitView} style={{ marginRight: '1vw' }}>
                            <img src={fitview} width={18} height={18} alt="firview" style={{ marginBottom: '0.4vh' }} />
                            Fit view
                        </a>
                        <a className='btn p-0' style={{ opacity: '10%', marginRight: '1vw' }}>|</a>
                        <a className='btn p-0' onClick={() => { setBackground() }} style={{ marginRight: '1vw' }}>
                            <img src={bkgnd['img']} width={13} height={13} alt="changebg" style={{ marginBottom: '0.4vh' }} />
                            &nbsp;
                            Change background {bkgnd['type']}
                        </a>
                        <a className='btn p-0' style={{ opacity: '10%', marginRight: '1vw' }}>|</a>
                        <Button className='btn p-0' onClick={() => undo()} disabled={!canUndo} style={{ marginRight: '1vw', color: 'black', backgroundColor: 'transparent', borderColor: 'transparent' }}>
                            <img src={indietro} width={18} height={18} alt="undo" style={{ marginBottom: '0.4vh' }} />
                            &nbsp;Undo
                        </Button>
                        <Button className='btn p-0' onClick={() => redo()} disabled={!canRedo} style={{ marginRight: '1vw', color: 'black', backgroundColor: 'transparent', borderColor: 'transparent' }}>
                            <img src={avanti} width={18} height={18} alt="redo" style={{ marginBottom: '0.4vh' }} />
                            &nbsp; Redo
                        </Button>
                        <a className='btn p-0' style={{ opacity: '10%', marginRight: '1vw' }}>|</a>
                        <a className='btn p-0' onClick={() => { setElementi((els) => removeElements(datanodeinfo.selected_element, els)) }} style={{ marginRight: '1vw' }}>
                            <img src={deletex} width={18} height={18} alt="delete" style={{ marginBottom: '0.4vh' }} />
                            &nbsp; Delete node
                        </a>
                        <a className='btn p-0' style={{ opacity: '10%', marginRight: '1vw' }}>|</a>
                        <a className='btn p-0' onClick={() => { setSelectedElements(nodes.map((node) => ({ id: node.id, type: node.type }))) }} style={{ marginRight: '1vw' }}>
                            <img src={selall} width={18} height={18} alt="delete" style={{ marginBottom: '0.4vh' }} />
                            &nbsp; Select all nodes
                        </a>
                        <a className='btn p-0' style={{ opacity: '10%', marginRight: '1vw' }}>|</a>
                        {/* <a className='btn p-0' onClick={() => { updateNodeInternals(datanodeinfo.selected_element.id); console.log(datanodeinfo.selected_element.id); }} style={{ marginRight: '1vw' }}>
                            <img src={selall} width={18} height={18} alt="delete" style={{ marginBottom: '0.4vh' }} />
                            &nbsp;  Refresh
                        </a>
                        <a className='btn p-0' style={{ opacity: '10%', marginRight: '1vw' }}>|</a> */}


                        {/* <NavDropdown title="Image details" id="collasible-nav-dropdown">
                                <NavDropdown.Item >1</NavDropdown.Item>
                                <NavDropdown.Item >2</NavDropdown.Item>
                                <NavDropdown.Item >3</NavDropdown.Item>
                                { }
                                <NavDropdown.Divider />
                                <NavDropdown.Item >Add Image</NavDropdown.Item>
                            </NavDropdown> */}
                    </Col>
                </Row>
            </Container>

        );
    }

    function addFootBar() {
        return (
            <Container className='cf vheight3 p-2' style={{ overflowX: 'hidden', overflowY: 'auto', textAlign: 'left' }}>
                <Row>
                    <Col>
                        <Row>
                            <Col>
                                <h5 className="d-inline p-0 m-0">Zoom & pan transform: </h5>
                                <div className="d-inline h6"> &nbsp;
                                    [{transform[0].toFixed(2)}, {transform[1].toFixed(2)}, {transform[2].toFixed(2)}]
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <h5 className='p-0 m-0'>Node selected:</h5>
                                {JSON.stringify(datanodeinfo.selected_element)}
                            </Col>
                        </Row>
                    </Col>
                    <Col >
                        <Row>
                            <h5 className='p-0 m-0'>Nodes:</h5>
                        </Row>
                        {
                            nodes.map(
                                (node) => (
                                    <div key={node.id} className='d-inline'>
                                        {node.data.label} - x: {node.__rf.position.x.toFixed(2)}, y: {node.__rf.position.y.toFixed(2)}&nbsp;&nbsp;&nbsp;
                                    </div>
                                )
                            )
                        }
                    </Col>
                </Row>
            </Container>
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    return (
        <div>
            <div style={{ minHeight: '10vh',/* maxHeight: '10vh',*/ }}>
                {addNavBar()}
                {addSubBar()}
            </div>
            <Container className='cf vheight' style={{ maxWidth: '100vw', }}>
                <Row className='justify-content-center text-center' style={{ /*minHeight: '100%',*/ maxWidth: '100vw', margin: '0' }} >
                    <Col xs={2} md={2} lg={2} className='justify-content-center text-center vheight' style={{ paddingRight: '1vw', }}>
                        {getSidebar()}
                    </Col>
                    <Col xs={dim_canvas} md={dim_canvas} lg={dim_canvas} className='justify-content-center text-center vheight' style={{ paddingTop: '1vh', paddingBottom: '1vh' }}>
                        {/* <ReactFlowProvider> */}
                        <div className='react-flow shadow' style={{ width: '100%', height: '100%' }} > {/* Attention! The dimensions of your React Flow component depend on the parents dimensions. */}
                            <ReactFlow
                                onLoad={setIstanzaReactFlow}  /* carica istanza -> per salvare lo stato del flow */
                                elements={elementi} /* Seleziona gli elementi da mostrare iniziali */
                                nodeTypes={allNodeTypes} /* definisce i vari tipi di nodi */
                                onElementsRemove={onElementsRemove} /* function da richiamare per l'eliminazione dei nodi */
                                deleteKeyCode={46} /* definisce pulsante shortucut per eliminare 'delete-key' ossia canc */
                                onConnect={onConnect} /* function da richiamare quando si connettono */
                                onDrop={onDrop} /* function da richiamare quando si trascina */
                                onDragOver={onDragOver} /* function da richiamare quando si posa un °QUALSIASI° elemento all'interno */
                                onElementClick={onElementClick} /* function quando si clicca un elemento */
                                onPaneClick={onPaneClick} /* Quando viene cliccato il canvas */
                                onNodeDoubleClick={onNodeDoubleClick} /* Quando viene cliccato 2 volte il nodo*/
                                maxZoom={15}
                            >
                                <Background
                                    variant={bkgnd['type']}
                                    gap={bkgnd['gap']}
                                    size={bkgnd['size']}
                                />
                                <Controls> {/*controlli basso-sx per zoom */}
                                    <ControlButton onClick={() => setBackground()}> {/*pulsante custom per lo sfondo*/}
                                        <img src={bkgnd['img']} width={15} height={15} alt=' '></img>
                                    </ControlButton>
                                    <ControlButton onClick={() => onSave()}> {/*pulsante custom per lo sfondo*/}
                                        <img src={save} width={15} height={15} alt=' '></img>
                                    </ControlButton>
                                    <ControlButton onClick={() => onRestore()}> {/*pulsante custom per lo sfondo*/}
                                        <img src={restore} width={15} height={15} alt=' '></img>
                                    </ControlButton>
                                </Controls>
                            </ReactFlow>
                        </div>
                        {/* </ReactFlowProvider> */}
                    </Col>

                    <Col xs={dim_sider} md={dim_sider} lg={dim_sider} className='justify-content-center text-center vheight' style={{ paddingLeft: '1vw', display: disp }}>
                        {showDataNode()}
                    </Col>
                </Row>
            </Container>

            <div className='vheight3' style={{ background: '' }}>
                {addFootBar()}
            </div>

        </div>
    );
}

export default FlowApp_t;