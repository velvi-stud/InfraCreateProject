import React, { useRef, useState, useEffect } from 'react';
import { Button, Overlay, Tooltip, Popover, OverlayTrigger } from 'react-bootstrap';
import ReactFlow, { Background, Handle, ReactFlowProvider, Controls } from 'react-flow-renderer';
import PortNode from '../PortNode.js';
import ServerNode from '../ServerNode.js';
import SubnetNode from '../SubnetNode.js';
import NetworkNode from '../NetworkNode.js';
import _ from 'lodash';


class xxx {
	constructor() {
		this.listType = [];
		this.listStyle = [];
		this.listMeta = [];
		// aggiungere nuovi elementi qui  -> ADD
		this.element = {
			server: new ServerNode(),
			port: new PortNode(),
			network: new NetworkNode(),
			subnet: new SubnetNode(),
		}
		// SETNAME -> ADD
		this.name = {
			server: this.element.server.getMeta(),
			port: this.element.port.getMeta(),
			network: this.element.network.getMeta(),
			subnet: this.element.subnet.getMeta(),
		}
		// VALORIZE
		Object.entries(this.element).map(
			([key, value]) => {
				this.listType.push(key);
				this.listStyle.push({ type: key, style: value.getStyle() });
				this.listMeta.push({ type: key, meta: value.getMeta() });
			}
		)
	}


	getListType() {
		return this.listType;
	}

	getListMeta() {
		return this.listMeta;
	}

	getListStyle() {
		return this.listStyle;
	}

	GetObj() {
		return this.name;
	}


}



const module_temp = (tipo1, style1, css_in1, css_out1) => {

	const tipo = tipo1;
	const style = style1;
	const css_in = css_in1;
	const css_out = css_out1;

	const ATN = new xxx();
	const allNodeTypes = ATN.GetObj();


	const Generate_custom_node = ({ data }) => {

		function handleprov() {
			let elemProv = data.topology.filter(element => element.data !== undefined && element.data.$net_type !== undefined && element.data.$net_type === 'provider');
			let sizeProv = _.size(elemProv);
			//console.log('prov:', aaa)
			let x = [];
			let a = 100 / (sizeProv + 1);
			let z = a;
			let l = undefined;
			var c = {};
			var d = {};
			Object.entries(elemProv).map(
				([key, value]) => {
					c = { top: z + '%' };
					d = {
						...css_out,
						...c
					}
					l =
						<Handle
							key={value.data.label}
							id={value.data.label}
							type="source"
							position="right"
							style={d}
						/>
						;
					x.push(l);
					z = z + a;
				}
			)

			//console.log('prov:',x);
			return x;
		}

		function handlecons() {
			let elemCons = data.topology.filter(element => element.data !== undefined && element.data.$net_type !== undefined && element.data.$net_type === 'consumer');
			let sizeCons = _.size(elemCons);			
			//console.log('cons:', sizeprov)
			let x = [];
			let a = 100 / (sizeCons + 1);
			let z = a;
			let l = undefined;
			var c = {};
			var d = {};
			Object.entries(elemCons).map(
				([key, value]) => {
					c = { top: z + '%' };
					d = {
						...css_in,
						...c
					}
					l =
						<Handle
							key={value.data.label}
							id={value.data.label}
							type="target"
							position="left"
							style={d}
						/>
						;
					x.push(l);
					z = z + a;
				}
			)

			//console.log('cons:',x);
			return x;
		}


		function Overlayy (){
			return (
				<OverlayTrigger trigger="click" placement="bottom" overlay={

					<Popover id="popover-basic" style={{ maxWidth: '100vw', borderWidth: '4px', textAlign: 'center' }}>
						<div
							style={{
								width: "40vw",
								height: "40vh",
								overflow: "visible",
								// fontSize: "1px",
								// pointerEvents: "none",
								background: "white",
								//display: BTN.display
							}}
						>
							<ReactFlowProvider>
								<ReactFlow
									maxZoom={2}
									defaultZoom={0.5}
									defaultPosition={[0, 0]}
									zoomOnPinch={true}
									panOnScroll={true}
									elements={data.topology}
									nodeTypes={allNodeTypes}
									snapToGrid={true}
									nodesDraggable={false}
									nodesConnectable={true}
								/>
								<Controls></Controls>
							</ReactFlowProvider>
						</div>
					</Popover>

				} rootClose>
					<Button variant="success">Click me to see</Button>
				</OverlayTrigger>
			);
		}

		//console.log('node '+tipo+' created');
		//const [BTN, setBTN] = useState({ title: 'Show topology', display: 'none' })

		//if(data.topology !== undefined && data.topology !== [] )
		//topology_data(data.topology);

		return (
			<div style={style}>

				{/* PORTA INGRESSO TIPO 1*/}
				{handlecons()}

				{/* NOME */}
				<div> <b> {data.label} </b></div>

				{/* Description */}
				<div> <p style={{ marginBottom: '0' }}> {data.description} </p> </div>

				{/* RF */}
				{/* <button type="button" className="btn btn-dark" style={{ fontSize: '1em' }} onClick={() => { (BTN.display === 'none') ? setBTN({ title: 'Hide topology', display: 'block' }) : setBTN({ title: 'Show topology', display: 'none' }) }}>{BTN.title}</button>
				<div
					style={{
						width: "30vw",
						height: "30vh",
						overflow: "visible",
						// fontSize: "1px",
						// pointerEvents: "none",
						background: "white",
						display: BTN.display
					}}
				>
					<ReactFlowProvider>
							<ReactFlow
								maxZoom={2}
								defaultZoom={0.5}
								defaultPosition={[0, 0]}
								zoomOnPinch={true}
								panOnScroll={true}
								elements={childelement}
								nodeTypes={allNodeTypes}
								snapToGrid={true}
								nodesDraggable={false}
								nodesConnectable={true}
							/>
							<Controls></Controls>
					</ReactFlowProvider>
				</div> */}

				{Overlayy()}

				{/* PORTA USCITA TIPO 1*/}
				{handleprov()}

			</div>
		)
	};


	return (Generate_custom_node);

}
export default module_temp;