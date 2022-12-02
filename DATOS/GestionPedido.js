import { util } from '../../Util/UtilClass.js?v=6';

const urlGeneral = NombreAplicacion + "/GeneralPost/ProcGeneralPost";
const UrlbdGeneral = NombreAplicacion + '/GeneralPost/ProcGeneralPostBDGeneral';
const UlrPorEmpresa = NombreAplicacion + '/GeneralPost/ProcGeneralPostBDParticular';

const selectFiltroConsulta = document.querySelector('#select-filtro-consulta');
const inputFechaInicio = document.querySelector('#input-fecha-inicio');
const inputFechaFin = document.querySelector('#input-fecha-fin');
const selectFiltroCliente = document.querySelector('#select-filtro-cliente');

const tablaPedidos = document.querySelector('#tabla-pedidos');
const tablaPedidosDetalle = document.querySelector('#tabla-pedidos-detalle')
const tablaVentasPedido = document.querySelector('#tabla-ventas-pedido')
const tablaGuiasPedido = document.querySelector('#tabla-guias-pedido')

const btnNuevo = document.querySelector('#btn-nuevo')
const btnProcesar = document.querySelector('#btn-procesar')
const btnAgregarProductos = document.querySelector('#btn-agregar-productos')
const btnReemplazarProductos = document.querySelector('#btn-reemplazar-productos')

const iconCargar = document.querySelector('#icon-cargar')
const inputProforma = document.querySelector('#input-proforma')
const inputCliente = document.querySelector('#input-cliente')
const inputDireccionEntrega = document.querySelector('#input-direccion-entrega')
const inputPersonalCliente = document.querySelector('#input-personal-cliente')
const inputFechaRecepcion = document.querySelector('#input-fecha-recepcion')
const inputFechaEntrega = document.querySelector('#input-fecha-entrega')
const checkFechaEntrega = document.querySelector('#input-check-fecha-entrega')
const textComentario = document.querySelector('#text-comentario')
const txtMotivoAnulacion = document.querySelector('#txt-motivo')
const columnasPedidos = 13;

//Dialog
const dialogPedidoJQ = $('#dialog-pedidos');
const dialogVentasPedidoJQ = $('#dialog-ventas-pedido');
const dialogGuiasPedidoJQ = $('#dialog-guias-pedido')
const dialogAnularPedidoJQ = $('#dialog-anular-pedido');
const divImprimirPedidoJQ = $('#div-imprimir-pedido');

//dialog codigo 
const TpDis = document.querySelector('#TpDis')
let sectionMG = document.getElementById('section-mg')
let sectionBD = document.getElementById('section-bd')
let inputMG = document.getElementById('input-mg')    
let inputBD = document.getElementById('input-bd')

document.addEventListener("DOMContentLoaded", async () => {
    $.ui.dialog.prototype._allowInteraction = function (e) {
        return !!$(e.target).closest('.ui-dialog, .ui-datepicker, .select2-dropdown, .tooltipster-content').length;
    };

    $('#txtBuscar').keyup(function () {
        $.uiTableFilter($('#tabla-pedidos'), this.value);
    });

    cargarModales();
    cargarElementos();
    cargarListaCadenas();
    productosPedidos.agregarAutoCompletadoCliente();
    productosPedidos.agregarAutoCompletadoProforma();
    await cargarEstados();
    await cargarClientes();
    await ordenPedido.listar();
})

const ordenPedido = {
    listar: async () => {
        iconCargar.style.display = '';
        
        const tbody = tablaPedidos.getElementsByTagName('tbody')[0]
        tbody.innerHTML = '';

        const cadenaEstados = obtenerCadenaEstado('select-estado');
        if (cadenaEstados == '') return

        const parametros = `${inputFechaInicio.value}|${inputFechaFin.value}|${selectFiltroConsulta.value}|${cadenaEstados}|${selectFiltroCliente.value}`
        const request = ['ProcSolicitudPedidoAGPS', parametros, 10];
        const response = await util.obtenerDatosBD(...request);
        const pedidos = response['dt0'];

        if (pedidos.length == 0) {
            util.limpiarTabla(tablaPedidos, columnasPedidos).notInfo();
            iconCargar.style.display = 'none';
            return
        }

        pedidos.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.classList.add('colorear');
            tr.addEventListener('click', () => util.pintarTr(tr));

            let tituloP = ''
            p.Proformas.split(',').forEach(p => {
                tituloP += `<div>${p}</div>`
            })

            tr.innerHTML = `
                <td style="text-align:center">${i + 1}</td>
                <td style="text-align:center">${p.FechaPedido}</td>
                <td ${p.Proformas != "" ? `title="${tituloP}"` : ''} class="tooltipsteredVenta" style="text-align:center; white-space:nowrap; cursor:pointer"><u>${p.SerieDocumento}-${p.CorrelativoDocumento}</u></td>
                <td style="max-width:300px;"><div style="width:100%; white-space: nowrap; overflow:hidden; text-overflow: ellipsis;">${p.NomCliente}</div></td>
                <td title="${p.Comentario}" style="max-width:350px;"><div style="width:100%; white-space: nowrap; overflow:hidden; text-overflow: ellipsis;">${p.Comentario}</div></td>
                <td style="text-align:center">${p.FechaAtencion}</td>
                <td style="text-align:center">${p.NomUsuarioAtencion}</td>
                <td style="text-align: center">${util.getEstado(p.CodEstado, p.NomEstado)}</td>
                <td style="width:50px;text-align: center; display: flex; justify-content: space-between" class="ventas"></td>
                <td style="width:50px;text-align: center" class="imprimir"></td>
                <td style="width:50px;text-align: center" class="eliminar"></td>
            `

            if (p.CantidadVentasEnlazadas > 0 && p.CodEstado != 10) 
            {
                tr.querySelector('.ventas').appendChild(util.getIconsActions(() => ordenPedido.abrirModalVentas(p.CodSolicitudPedidoAGPS, `${p.SerieDocumento}-${p.CorrelativoDocumento}`)).config('primary', 'VENTAS'))
                tr.querySelector('.ventas').children[0].style.marginRight = '10px'
            }
            ![10, 18].includes(Number(p.CodEstado)) && tr.querySelector('.ventas').appendChild(util.getIconsActions(() => ordenPedido.generarVentaPedido(p.CodSolicitudPedidoAGPS)).config('success', '<i title="Generar Venta" class="fas fa-external-link-alt"></i>'))
            
            tr.querySelector('.imprimir').appendChild(util.getIconsActions(() => ordenPedido.imprimirPedido(p.CodSolicitudPedidoAGPS), 'span').print())
            p.CodEstado != 10 && tr.querySelector('.eliminar').appendChild(util.getIconsActions(() => ordenPedido.abrirModalAnular(p.CodSolicitudPedidoAGPS, `${p.SerieDocumento}-${p.CorrelativoDocumento}`)).delete())
            tbody.appendChild(tr)                               
        })

        $('.tooltipsteredVenta').tooltipster({ multiple: true, contentAsHTML: true });

        iconCargar.style.display = 'none';
    },

    

    verificarCodigo: async (codDispositivo,codEmpresa) => {
        let cadenaConexion = jsonCadena.find(e => e.codEmpresa == codEmpresa).cadenaConexion
        const Data = {
            Procedimiento: 'ProcDispositivoAV2',
            Parametro: codDispositivo + '|' + TpDis.value,
            Indice: 16,
            Cadena: cadenaConexion
        };

        const Datos = await fetch(UlrPorEmpresa, DataFetch(Data, 'POST')).then(res => res.json());
        const jsondata = Datos['dt0'][0];
        return jsondata
    },
    
    LimpiarModal: () => {
        document.querySelector('#input-bd').value = '';
        document.querySelector('#input-mg').value = '';
        document.querySelector('#TpDis').selectedIndex = "1";
    },

    abrirModal: () => {
        productosPedidos.primeraCarga();
        dialogPedidoJQ.dialog({
            title: 'Nuevo Pedido',
            buttons: [
                {
                    text: 'Guardar',
                    click: () => {
                        productosPedidos.guardarOrdenPedido();
                    }
                },
                {
                    text: 'Cancelar',
                    click: () => dialogPedidoJQ.dialog('close')
                }
            ],
            close: () => {
                productosPedidos.limpiar();
                productosPedidos.proformasUsadas = [];
                productosPedidos.productosAlmacenados = [];
                productosPedidos.proforma = {}
                inputProforma.value = '';
            }
        })

        dialogPedidoJQ.dialog('open');
    },

    abrirModalVentas: async (codSolicitudPedidoAGPS, documento) => {
        const tbodyVentas = tablaVentasPedido.getElementsByTagName('tbody')[0];
        tbodyVentas.innerHTML = '';

        const request = ['dbo.ProcSolicitudPedidoAGPS', codSolicitudPedidoAGPS, 16];
        const response = await util.obtenerDatosBD(...request);
        const ventas = response['dt0'];

        ventas.forEach((v, i) => {
            const tr = document.createElement('tr');
            tr.classList.add('colorear');
            tr.addEventListener('click', () => util.pintarTr(tr));

            const esDocumentoElectronico = v.DocumentoElectronico == 1 ? true : false

            tr.innerHTML = `
                <td style="text-align:center">${i + 1}</td>
                <td style="text-align:center; white-space: nowrap">${v.FechaVenta}</td>
                <td style="text-align:center; white-space: nowrap">${v.SerieDocumento} ${v.CorrelativoDocumento}</td>
                <td style="text-align:center; white-space: nowrap">${v.NomMoneda}</td>
                <td style="text-align:center; white-space: nowrap">${v.SimboloMoneda} ${Number(v.ImporteSubTotal).toFixed(2)}</td>
                <td style="text-align:center; white-space: nowrap">${v.SimboloMoneda} ${Number(v.ImporteIGV).toFixed(2)}</td>
                <td style="text-align:center; white-space: nowrap">${v.SimboloMoneda} ${Number(v.ImporteTotal).toFixed(2)}</td>
                <td style="text-align:center">${util.getEstado(v.CodEstado, v.NomEstado)}</td>
                <td style="text-align:center" class="imp-venta"></td>
                <td style="text-align:center; display: flex" class="guia-remision"></td>
            `
            tr.querySelector('.imp-venta').appendChild(util.getIconsActions(() => ordenPedido.imprimirDocumentoVenta(v.CodVenta, esDocumentoElectronico, v.URLNombreDocumento ), 'span').print(true))

            v.CantidadGuiaRemision > 0 && tr.querySelector('.guia-remision').appendChild(util.getIconsActions(() => guiaRemision.abrirModal(v.CodVenta, `${v.SerieDocumento}-${v.CorrelativoDocumento}`)).config('info', '<span>G.R</span>', true))
            v.CantidadGuiaRemision > 0 && (tr.querySelector('.guia-remision').children[0].style.marginRight = '10px')
            
            v.CodEstado == 9 && tr.querySelector('.guia-remision').appendChild(util.getIconsActions(() => guiaRemision.generarGuia(`${v.SerieDocumento}`, `${v.CorrelativoDocumento}`, v.
            CodDocumento)).config('success', '<i title="Generar Guia de Remisión" class="fas fa-external-link-alt"></i>', true))

            tbodyVentas.appendChild(tr);
        })

        dialogVentasPedidoJQ.dialog({
            title: 'Ventas [' + documento + ']',
            buttons: [
                {
                    text: 'Cerrar',
                    click: () => dialogVentasPedidoJQ.dialog('close')
                }
            ]
        })

        dialogVentasPedidoJQ.dialog('open')
    },
    imprimirDocumentoVenta: (codigoVenta, esDocumentoElectronico, nombreDocumento, esGuia) => {
        var esReimpresion = true;

        if (Number(esGuia) == 1) {
            if (esDocumentoElectronico) {
                ImprimirDocumentosElectronico(codigoVenta, "_GuiaRemisionElectronica", null, esReimpresion);
            } else {
                ImprimirDocumentosElectronico(codigoVenta, "_GuiaRemision", null, esReimpresion);
            }
        } else {
            var nombreDocumentoImpresion = nombreDocumento;
            ImprimirDocumentosElectronico(codigoVenta, nombreDocumentoImpresion, null, esReimpresion);
        }
    },
    generarVentaPedido: (codSolicitudPedidoAGPS) => {
        const cadenaVenta = `${codSolicitudPedidoAGPS}|17` //17 - nota de venta
        window.open(`${NombreAplicacion}/Venta/Ventas?d=${submitsEncry(cadenaVenta, "encrypt").toString()}&tipo=1`, '_blank');
    },
    imprimirPedido: async (codSolicitudPedidoAGPS) => {
        const request = ['dbo.ProcSolicitudPedidoAGPS', codSolicitudPedidoAGPS, 12];
        const response = await util.obtenerDatosBD(...request);
        const cabecera = response['dt0'][0];
        const cuerpo = response['dt1']

        const impNumDocumento = document.querySelector('#imp-num-documento');
        const impRazonSocial = document.querySelector('#imp-razon-social');
        const impDireccion = document.querySelector('#imp-direccion');
        const impRucSocial = document.querySelector('#imp-ruc-cliente');
        const impFechaRecepcion = document.querySelector('#imp-fecha-recepcion');
        const impEncargado = document.querySelector('#imp-encargado');
        const impFormaPedido = document.querySelector('#imp-forma-pedido');
        const impFechaAtencion = document.querySelector('#imp-fecha-atencion');
        const impEncargadoRecepcion = document.querySelector('#imp-encargado-recepcion')
        const impTabaProductos = document.querySelector('#imp-tabla-productos');

        impNumDocumento.textContent = cabecera.SerieDocumento + ' ' + cabecera.CorrelativoDocumento;
        impRazonSocial.textContent = cabecera.NomPersona;
        impDireccion.textContent = cabecera.DireccionEntrega;
        impRucSocial.textContent = cabecera.NroDocumento;
        impFechaRecepcion.textContent = cabecera.FechaPedido;
        impEncargado.textContent = cabecera.EncargadoPedido;
        impFormaPedido.textContent = cabecera.FormaPedido;
        impFechaAtencion.textContent = cabecera.FechaAtencion;
        impEncargadoRecepcion.textContent = cabecera.NomPersonaRecepcion;

        // if (cabecera.FechaAtencion == '') $('.fila-entrega').css('display', 'none');

        const tbody = impTabaProductos.getElementsByTagName('tbody')[0];
        let strCuerpo = '';

        cuerpo.forEach((pro, i) => {            
            strCuerpo += `
                <tr class="">
                    <td style="width: 1cm; border: 1px solid black;  padding: 6px 10px; text-align:center">${i + 1}</td>
                    <td style="width: 12cm; border: 1px solid black; padding: 6px 10px">${pro.NomProducto}</td>
                    <td style="width: 2cm; border: 1px solid black;  padding: 6px 10px; text-align:center">${pro.Cantidad}</td>
                    <td style="width: 5cm; border: 1px solid black;  padding: 6px 10px">${pro.ComentarioProducto}</td>
                </tr>
            `
        })

        tbody.innerHTML = strCuerpo;

        divImprimirPedidoJQ.printArea()
    },
    abrirModalAnular: (codDocumento, documento) => {
        dialogAnularPedidoJQ.dialog({
            title: 'Anular Pedido [' + documento + ']',
            buttons: [
                {
                    text: 'Si',
                    click: async () => {
                        const comentario = txtMotivoAnulacion.value;

                        if (comentario.trim().length == 0) {
                            util.MostrarMensaje('Debe ingresar un comentario de eliminación', 0);
                            txtMotivoAnulacion.focus();
                            return
                        }

                        const parametros = `${codUser}|${codDocumento}|${comentario}`;
                        const request = ['dbo.ProcSolicitudPedidoAGPS', parametros, 40];
                        const response = await util.obtenerDatosBD(...request);
                        const data = response['dt0'][0];
                        
                        util.MostrarMensaje(data.DesResultado, data.CodResultado);

                        if (data.CodResultado == 1) {
                            ordenPedido.listar();
                            dialogAnularPedidoJQ.dialog('close');
                        }
                    }
                },
                {
                    text: 'No',
                    click: () => dialogAnularPedidoJQ.dialog('close')
                }
            ]
        })

        dialogAnularPedidoJQ.dialog('open')
    }


}

const productosPedidos = {
    tbodyDetalle: tablaPedidosDetalle.getElementsByTagName('tbody')[0],
    contador: 0,
    proforma: {},
    productosAlmacenados: [],
    proformasUsadas: [],
    filaActual: tablaPedidosDetalle.getElementsByTagName('tbody')[0].getElementsByTagName('tr')[0],
    obtenerCantidadFilas: () => productosPedidos.tbodyDetalle.children.length,
    primeraCarga: () => {
        const nuevoTr = productosPedidos.generarNuevaFila(false)
        productosPedidos.tbodyDetalle.appendChild(nuevoTr)
        productosPedidos.agregarAutoCompletado(nuevoTr)
    },
    generarNuevaFila: (btnElimnar = true) => {
        const tr = document.createElement('tr')
        tr.style.height = '40px'
        tr.setAttribute('cod-producto', 0);
        tr.setAttribute('comentario', '');

        tr.innerHTML = `
            <td class="td-numeral">${productosPedidos.obtenerCantidadFilas() + 1}</td>
            <td>
                <input class="input-nombre-producto form-control" style="height: 30px;"/>
            </td>
            <td class="">
                <i class="input-mensaje-producto" data-tooltip-content="#demo-html-content" style="font-weight: bold;;margin-left:5px;cursor:pointer;font-size: 17px;margin-top: -4px;">(...) </i>
            </td>
            <td style="text-align: center">
                <input class="input-cantidad-producto form-control" style="height: 30px; width: 80px; display: inline; text-align: center"/>
            </td>
            <td class="eliminar-detalle">
            </td>
        `

        btnElimnar && tr.querySelector('.eliminar-detalle').appendChild(util.getIconsActions(() => productosPedidos.quitarFila(tr)).delete(true))
        tr.querySelector('.input-nombre-producto').addEventListener('focus', (e) => {
            productosPedidos.filaActual = tr
            e.target.select()
        });        
        tr.querySelector('.input-nombre-producto').addEventListener('keyup', (e) => {
            if (e.target.value.trim().length == 0) {
                e.target.setAttribute('nom-producto', 0)
                tr.setAttribute('cod-producto', 0)
                tr.setAttribute('comentario', '')
            }
        });
        tr.querySelector('.input-cantidad-producto').addEventListener('focus', (e) => {
            productosPedidos.filaActual = tr
            e.target.select()
        }); 
        tr.querySelector('.input-nombre-producto').addEventListener('blur', (e) => {
            if (tr.getAttribute('cod-producto') != 0) {
                const comentario = tr.getAttribute('comentario');
                e.target.value = e.target.getAttribute('nom-producto') + (comentario == '' ? '' : ' (' + comentario + ')')
            }
        });      
        tr.querySelector('.input-cantidad-producto').addEventListener('keyup', (e) => productosPedidos.agregarNuevaFila(e, tr));
        tr.querySelector('.input-mensaje-producto').addEventListener('click', (e) => productosPedidos.visualizarMensajeProducto(e, tr));
        return tr;
    },
    agregarNuevaFila: (e, tr) => {
        if (e.key === 'Enter') {
            productosPedidos.contador++

            if (productosPedidos.contador == 2) {
                const existeTrAdelante = tr.nextSibling ? true : false;

                if (!existeTrAdelante) {
                    tr.querySelector('.eliminar-detalle').innerHTML = ''
                    tr.querySelector('.eliminar-detalle').appendChild(util.getIconsActions(() => productosPedidos.quitarFila(tr)).delete(true))
                    
                    const nuevoTr = productosPedidos.generarNuevaFila()
                    productosPedidos.tbodyDetalle.appendChild(nuevoTr)
                    nuevoTr.querySelector('.input-nombre-producto').focus()
                    productosPedidos.agregarAutoCompletado(nuevoTr)
                }
            }
        }
    },
    quitarFila: (tr) => {
        productosPedidos.reiniciarNumeros(tr)
        tr.remove()
        productosPedidos.contador = 0

        const numeroHijos = productosPedidos.tbodyDetalle.children.length
        if (numeroHijos == 1) {
            productosPedidos.tbodyDetalle.children[0].querySelector('.eliminar-detalle').innerHTML = ''
        }

    },
    reiniciarNumeros: (trActual) => {
        let restarUno = false;

        productosPedidos.tbodyDetalle.childNodes.forEach(tr => {
            if (tr == trActual) {
                restarUno = true;
            }

            if (restarUno) {
                tr.querySelector('.td-numeral').textContent = Number(tr.querySelector('.td-numeral').textContent) - 1
            }
        })
    },
    agregarAutoCompletado: (tr) => {
        $('.input-nombre-producto').autocomplete({
            source: async function (request, response) {
                const requestDB = ['ProcVenta', request.term + "|" + codCajaGestion , 13];
                const responseDB = await util.obtenerDatosBD(...requestDB);

                dialogPedidoJQ.parent().css('z-index', '200');
                const productos = responseDB['dt0'];
                const item = [];

                productos.forEach(p => {
                    const objetoProducto = {
                        NomProducto: p.NomProducto,
                        Marca: p.Marca,
                        AbrevProductoUM: p.AbrevProductoUM,
                        PrecioCosto: p.PrecioCosto,
                        Caracteristicas: p.Caracteristicas,
                        CodProducto: p.CodProducto,
                        SerieProducto: (p.SerieProducto == true ? 1 : 0),
                        Serie: p.Serie,
                        PrecioVenta: p.PrecioVenta,
                        CodigoProducto: p.CodigoProducto,
                        StockAlmacen: p.StockAlmacen,
                        StockAlmacenMin: p.StockMinimo,
                        CodAlmacen: p.CodAlmacen,
                        CodMoneda: p.CodMoneda,
                        CodProductoTipo: p.CodProductoTipo,
                        PoseeDetraccion: p.PoseeDetraccion,
                        CodDetraccionBienServicio: p.CodDetraccionBienServicio,
                        CodComprobanteTipoAfectacion: p.CodComprobanteTipoAfectacion
                    }
                    var producto = {
                        value: p.NomProducto + (p.Marca == '' || p.Marca + '' == 'NUll' ? '' : ", " + p.Marca) + (p.Caracteristicas == '' || p.Caracteristicas + '' == 'NUll' ? '' : ", " + p.Caracteristicas),
                        id: p.CodProducto,
                        objetoProducto: objetoProducto
                    }
                    item.push(producto);
                })
                response(item);
                $('.ui-autocomplete').css('z-index', '9999999');
            },
            minLength: 1,
            select: function (event, ui) {
                productosPedidos.contador = 0
                productosPedidos.filaActual.querySelector('.input-cantidad-producto').focus();
                productosPedidos.filaActual.querySelector('.input-cantidad-producto').value = 0
                productosPedidos.filaActual.querySelector('.input-cantidad-producto').select();
                productosPedidos.filaActual.querySelector('.input-nombre-producto').setAttribute('nom-producto', ui.item.value);
                productosPedidos.filaActual.setAttribute('cod-producto', ui.item.id)
                productosPedidos.filaActual.setAttribute('comentario', '')
            }
        })
    },
    visualizarMensajeProducto: (e, tr) => {
        // $('#tooltipsterTemporal').removeAttr('id');
        // $.each($('#VentaDeProductos tbody > tr'), function () {
        //     $(this).find('td').eq(1).find('div').find('input').removeAttr('id')
        // });
        const elemento = e.target;
        const inputNombreProducto = tr.querySelector('.input-nombre-producto')
        const filaElemento = tr;
        let comentarioguardado = filaElemento.getAttribute('comentario');
        comentarioguardado = (comentarioguardado == undefined ? '' : comentarioguardado)
    
        $('.input-mensaje-producto').tooltipster({
            trigger: 'click',
            contentAsHTML: true,
            interactive: true,
            multiple: true,
            items: '*:not(.ui-dialog-titlebar-close)'
        });
    
        var contenidoElementos =    '<table>' +
                                        '<tr>' +
                                            '<td>Comentario :</td>' + // filaElemento
                                            '<td> <input id="tooltipsterTemporal"   style="width:400px" autocomplete="off" type="text" name="name" value="' + comentarioguardado + '" /></td>' +
                                        '</tr>' +
                                    '</table>';
        $('.input-mensaje-producto').tooltipster('content', contenidoElementos);

        setTimeout(() => {
            $('#tooltipsterTemporal').select();
            try {
                document.getElementById('tooltipsterTemporal').addEventListener('keyup', (e) => productosPedidos.guardarMensaje(e.target, filaElemento, inputNombreProducto))
            } catch {}
        }, 250);
    },
    guardarMensaje: (elemento, filaElemento, inputNombreProducto) => {
        var nomProducto = inputNombreProducto.getAttribute('nom-producto');
        if (nomProducto == undefined || nomProducto == '') {
            util.MostrarMensaje("Tiene que registrar un producto antes de ingresar el comentario", 2);
            elemento.value = ''
            inputNombreProducto.focus()
            inputNombreProducto.select()
            $('.input-mensaje-producto').tooltipster('hide');
        } else {
            var valorElemento = elemento.value;
            filaElemento.setAttribute('comentario', valorElemento);
            var valorNombreProducto = inputNombreProducto.value;
            inputNombreProducto.value = nomProducto + (valorElemento === "" ? "" : ' (' + valorElemento + ')');
            if (event.key == 'Enter') {
                $('.input-mensaje-producto').tooltipster('hide');
            }
        }
    },
    agregarAutoCompletadoCliente: () => {
        $('#input-cliente').autocomplete({
            source: async function (request, response) {
                const requestDB = ['ProcCliente', request.term, 12];
                const responseDB = await util.obtenerDatosBD(...requestDB);

                dialogPedidoJQ.parent().css('z-index', '200');
                const clientes = responseDB['dt0'];
                const item = [];

                clientes.forEach(c => {
                    const objetoCliente = {
                        NomCliente: c.NomCliente,
                        CodCliente: c.CodCliente,
                        CodDocumentoIdentidadTipo: c.CodDocumentoIdentidadTipo,
                        PaternoCliente: c.PaternoCliente,
                        MaternoCliente: c.MaternoCliente,
                        CorreoElectronico: c.CorreoElectronico,
                        Telefono: c.Telefono,
                        Direccion: c.Direccion,
                        NroDocumento: c.NroDocumento,
                        NomUbigeoCompleto: c.NomUbigeoCompleto,
                        CodUbigeoClienteSunat: c.CodUbigeoClienteSunat,
                        PoseeDeuda: c.PoseeDeuda
                    }
                    const cliente = {
                        value: c.NomCliente,
                        id: c.CodCliente,                        
                        objetoCliente: objetoCliente
                    }
                    item.push(cliente);
                })
                response(item);
                $('.ui-autocomplete').css('z-index', '9999999');
            },
            minLength: 1,
            open: function (event, ui) {
            },
            select: function (event, ui) {
                inputCliente.setAttribute('cod-cliente', ui.item.id);
                inputDireccionEntrega.value = ui.item.objetoCliente.Direccion
                inputPersonalCliente.focus();
                textComentario.value = textComentario.value.trim();
            }
        })
    },
    construiCadenaProductos: () => {
        let cadenaProductos = '';
        let productoConCantidadCero = false;
        let filaSinProducto = false;
        const filasProductos = productosPedidos.tbodyDetalle.children;

        for (let i = 0; i < filasProductos.length; i++) {
            const fila = filasProductos[i]
            const codProducto = fila.getAttribute('cod-producto');
            const comentario = fila.getAttribute('comentario');
            const cantidad = fila.querySelector('.input-cantidad-producto').value;

            codProducto == 0 && (filaSinProducto = true)
            cantidad == 0 && (productoConCantidadCero = true)

            cadenaProductos += `${codProducto}~${comentario}~${cantidad}^`
        }

        cadenaProductos = cadenaProductos.substring(0, cadenaProductos.length - 1);

        return {
            cadenaProductos,
            filaSinProducto,
            productoConCantidadCero
        };
    },
    guardarOrdenPedido: async () => {
        const codCliente = inputCliente.getAttribute('cod-cliente');
        const direccionEntrega = inputDireccionEntrega.value;
        const encargadoPedido = inputPersonalCliente.value
        const fechaRecepcion = inputFechaRecepcion.value;
        const enviarFechaEntrega = checkFechaEntrega.checked;
        const fechaEntrega = enviarFechaEntrega ? inputFechaEntrega.value : '';
        const formaPedido = 'Email'
        const comentario = textComentario.value;
        const codProforma = productosPedidos.proformasUsadas.toString() //inputProforma.getAttribute('cod-proforma');
        const { cadenaProductos, filaSinProducto, productoConCantidadCero } = productosPedidos.construiCadenaProductos();

        if (codCliente == 0 || !codCliente) {
            util.MostrarMensaje('Debe ingresar un cliente', 0)
            inputCliente.focus();
            return
        }

        if (direccionEntrega.trim().length == 0) {
            util.MostrarMensaje('Debe ingresar la dirección de entrega.', 0)
            inputDireccionEntrega.focus();
            return
        }

        if (encargadoPedido.trim().length == 0) {
            util.MostrarMensaje('Debe Ingresar los datos del encargado del pedido.', 0)
            inputPersonalCliente.focus();
            return
        }

        if (cadenaProductos.trim().length == 0) {
            util.MostrarMensaje('Debe Ingresar al menos un producto.', 0)
            return
        }

        if (filaSinProducto) {
            util.MostrarMensaje('No puede realizar un pedido si no escoge un producto.', 0)
            return
        }

        if (productoConCantidadCero) {
            util.MostrarMensaje('No puede realizar un pedido con cantidad cero.', 0)
            return
        }

        const parametros = `${codCliente}|${direccionEntrega}|${encargadoPedido}|${formaPedido}|${fechaRecepcion}|${fechaEntrega}|${comentario}|${codUser}|${codProforma}|${cadenaProductos}`;
        
        const request = ['dbo.ProcSolicitudPedidoAGPS', parametros, 23];
        const response = await util.obtenerDatosBD(...request);
        const data = response['dt0'][0]

        util.MostrarMensaje(data.DesResultado, data.CodResultado);

        if (data.CodResultado == 1) {
            ordenPedido.listar();
            dialogPedidoJQ.dialog('close');
        }
    },
    limpiar: () => {
        productosPedidos.tbodyDetalle.innerHTML = '';
        inputCliente.value = '';
        inputCliente.setAttribute('cod-cliente', '');
        inputDireccionEntrega.value = '';
        inputPersonalCliente.value = '';
        inputFechaRecepcion.value = util.obtenerFechaActual();
        inputFechaEntrega.value = util.obtenerFechaActual();
        textComentario.value = '';
        inputProforma.setAttribute('cod-proforma', '0')
    },
    agregarAutoCompletadoProforma: () => {
        inputProforma.addEventListener('focus', (e) => e.target.select())
        inputProforma.addEventListener('keyup', (e) => {
            e.target.value = e.target.value.toUpperCase()
            if (e.target.value.trim().length == 0) {
                e.target.setAttribute('cod-proforma', 0)
            }
        })

        $('#input-proforma').autocomplete({
            source: async function (request, response) {
                const requestDB = ['dbo.ProcSolicitudPedidoAGPS', request.term, 18];
                const responseDB = await util.obtenerDatosBD(...requestDB);

                dialogPedidoJQ.parent().css('z-index', '200');
                const proformas = responseDB['dt0'];
                const productos = responseDB['dt1'];
                const item = [];

                proformas.forEach(pr => {
                    const objDatos = {
                        codCliente: pr.CodPersonaCliente,
                        nomCliente: pr.NomPersona,
                        direccion: pr.Direccion,
                        comentario: pr.Comentario,
                        productos: productos.filter((p, i) => pr.CodProforma == p.CodProforma)
                    }
                    var pedido = {
                        value: pr.SerieDocumento + '-' + pr.CorrelativoDocumento,
                        id: pr.CodProforma,
                        objDatos
                    }
                    item.push(pedido);
                })

                response(item);
                $('.ui-autocomplete').css('z-index', '9999999');
            },
            minLength: 2,
            select: function (event, ui) {
                const pedido = ui.item.objDatos
                const productos = pedido.productos

                // productosPedidos.limpiar();

                productosPedidos.proforma = {
                    codProforma: ui.item.id,
                    pedido,
                    productos
                }
                
                // inputCliente.value = pedido.nomCliente;
                // inputCliente.setAttribute('cod-cliente', pedido.codCliente);
                // inputDireccionEntrega.value = pedido.direccion;
                // textComentario.value = pedido.comentario;

                // productos.forEach((p, i) => {
                //     const nuevoTr = productosPedidos.generarNuevaFila();
                //     nuevoTr.setAttribute('cod-producto', p.CodProducto)
                //     nuevoTr.setAttribute('comentario', p.DescripcionProducto)
                //     nuevoTr.querySelector('.input-nombre-producto').value = p.NomProducto + (p.DescripcionProducto == '' ? '' :  ' (' + p.DescripcionProducto + ')');
                //     nuevoTr.querySelector('.input-nombre-producto').setAttribute('nom-producto', p.NomProducto)
                //     nuevoTr.querySelector('.input-cantidad-producto').value = p.CantidadProducto;

                //     productosPedidos.tbodyDetalle.appendChild(nuevoTr);
                // });

                // inputProforma.setAttribute('cod-proforma', ui.item.id)
            }
        })
    },
    actualizarListaProductos: (agregar = true) => {
        if (Object.keys(productosPedidos.proforma).length === 0) {
            util.MostrarMensaje('Seleccione una Proforma', 0)
            return
        }

        const { codProforma, pedido, productos } = productosPedidos.proforma

        productosPedidos.limpiar();

        if (agregar) {
            productosPedidos.productosAlmacenados = productosPedidos.productosAlmacenados.concat(productos)
            productosPedidos.productosAlmacenados.forEach(pa => {
                const productosIguales = productosPedidos.productosAlmacenados.filter(pa2 => (pa.CodProducto == pa2.CodProducto && pa.CodProforma != pa2.CodProforma))
                if (productosIguales.length > 0) {
                    productosIguales.forEach(pi => {
                        pa.CantidadProducto = Number(pa.CantidadProducto) + Number(pi.CantidadProducto) 

                        const indice = productosPedidos.productosAlmacenados.indexOf(pi)
                        productosPedidos.productosAlmacenados.splice(indice, 1)
                    })
                }
            })

            if (!productosPedidos.proformasUsadas.includes(codProforma)) {
                productosPedidos.proformasUsadas.push(codProforma)
            }
        } else {
            productosPedidos.productosAlmacenados = productos
            productosPedidos.proformasUsadas = []
            productosPedidos.proformasUsadas.push(codProforma)
        }


        inputCliente.value = pedido.nomCliente;
        inputCliente.setAttribute('cod-cliente', pedido.codCliente);
        inputDireccionEntrega.value = pedido.direccion;
        textComentario.value = pedido.comentario;

        productosPedidos.productosAlmacenados.forEach((p, i) => {
            const nuevoTr = productosPedidos.generarNuevaFila();
            nuevoTr.setAttribute('cod-producto', p.CodProducto)
            nuevoTr.setAttribute('comentario', p.DescripcionProducto)
            nuevoTr.querySelector('.input-nombre-producto').value = p.NomProducto + (p.DescripcionProducto == '' ? '' :  ' (' + p.DescripcionProducto + ')');
            nuevoTr.querySelector('.input-nombre-producto').setAttribute('nom-producto', p.NomProducto)
            nuevoTr.querySelector('.input-cantidad-producto').value = p.CantidadProducto;

            productosPedidos.tbodyDetalle.appendChild(nuevoTr);
        });

        productosPedidos.proforma = {}
        inputProforma.value = ""
    }
}

const guiaRemision = {
    listar: async (codVenta) => {
        const tbodyGuias = tablaGuiasPedido.getElementsByTagName('tbody')[0];
        tbodyGuias.innerHTML = '';

        const request = ['dbo.ProcSolicitudPedidoAGPS', codVenta, 17];
        const response = await util.obtenerDatosBD(...request);
        const guias = response['dt0'];

        guias.forEach((g, i) => {
            const tr = document.createElement('tr');
            tr.classList.add('colorear');
            tr.addEventListener('click', () => util.pintarTr(tr));

            tr.innerHTML = `
                <td style="text-align:center; white-space:nowrap;">${i + 1}</td>
                <td style="text-align:center; white-space:nowrap;">${g.FechaEmision}</td>
                <td style="text-align:center; white-space:nowrap;">${g.SerieDocumento}-${g.CorrelativoDocumento}</td>
                <td style="text-align:center; white-space:nowrap;">${g.CantidadPaquetes}</td> 
                <td title="${g.RazonSocialTransporte}" style="max-width:300px;">
                    <div style="width:100%; white-space: nowrap; overflow:hidden; text-overflow: ellipsis;">${g.RazonSocialTransporte}</div>
                </td>
                <td style="width:50px" class="imp-guia-pedido"></td>
            `

            tr.querySelector('.imp-guia-pedido').appendChild(util.getIconsActions(() => guiaRemision.imprimir(g.CodVentaGuiaRemision), 'span').print(true))

            tbodyGuias.appendChild(tr);
        })
    },
    abrirModal: (codVenta, documentoVenta) => {
        guiaRemision.listar(codVenta);

        dialogGuiasPedidoJQ.dialog({
            title: `Guias de remisión de la venta [${documentoVenta}]`,
            buttons: [
                {
                    text: 'Cerrar',
                    click: () => dialogGuiasPedidoJQ.dialog('close')
                }
            ]
        })

        dialogGuiasPedidoJQ.dialog('open');
    },
    imprimir: (codVentaGuiaRemision) => {
        const esReimpresion = true;
        ImprimirDocumentosElectronico(codVentaGuiaRemision, '_GuiaRemision', null, esReimpresion);
    },
    generarGuia: (serie, correlativo, documentoBusqueda) => {
        const documento = 19; // Guia de Remisión no contable
        const cadenaParaVenta = `${serie}|${correlativo}|${documento}|${documentoBusqueda}`;
        window.open(`${NombreAplicacion}/Venta/Ventas?d=${submitsEncry(cadenaParaVenta, "encrypt").toString()}&tipo=0`, '_blank');
    }
}

window.ocultarMostrarMGBD = () => {
    if(TpDis.value == 1){
        sectionMG.style.display = ''
        sectionBD.style.display = 'none';
        inputBD.value = '';
    }else{
        sectionMG.style.display = 'none';
        sectionBD.style.display = '';
        inputMG.value = '';
    }
}

let jsonCadena = [];

async function cargarListaCadenas(){
    const Data = {
        Procedimiento: 'ProcEmpresaV2',
        Parametro: '',
        Indice: 12,
    }
    const Datos = await fetch(UrlbdGeneral, DataFetch(Data, 'POST')).then(res => res.json());
    const jsondata = Datos['dt0'];
    
    jsondata.forEach((data)=>{
        jsonCadena.push({
            codEmpresa: data.CodEmpresa,
            cadenaConexion: data.CadenaConexion
        })
    })
}

async function cargarInputsCodigos(){

}

function cargarElementos() {
    $('.date').datepicker({
        dateFormat: 'dd/mm/yy',
    })

    btnNuevo.addEventListener('click', () => ordenPedido.abrirModal())
    btnProcesar.addEventListener('click', () => ordenPedido.listar())
    btnAgregarProductos.addEventListener('click', () => productosPedidos.actualizarListaProductos(true))
    btnReemplazarProductos.addEventListener('click', () => productosPedidos.actualizarListaProductos(false))
    inputCliente.addEventListener('focus', (e) => e.target.select())
    inputCliente.addEventListener('keyup', (e) => {
        if (e.target.value.trim().length == 0) {
            e.target.setAttribute('cod-cliente', 0)
        }
    });

    selectFiltroConsulta.addEventListener('change', (e) => {        
        $('.RangoFecha').css('display', e.target.value == 1 ? 'none' : '')
        util.limpiarTabla(tablaPedidos, columnasPedidos).process();
    })

    checkFechaEntrega.addEventListener('change', (e) => {
        const activo = e.target.checked
        $('.fecha-entrega').css('display', activo ? '' : 'none');
    })
}

function cargarModales() {
    util.modal(dialogPedidoJQ, 'auto', 'auto', true, false, false, true, '');
    util.modal(dialogVentasPedidoJQ, 'auto', 'auto', true, false, false, true, '')
    util.modal(dialogGuiasPedidoJQ, 'auto', 'auto', true, false, false, true, '')
    util.modal(dialogAnularPedidoJQ, 'auto', 'auto', true, false, false, true, '')
}

async function cargarEstados() {
    const selectEstado = document.querySelector('#select-estado')
    const data = {
        Procedimiento: 'dbo.ProcSolicitudPedidoAGPS',
        Parametro: '',
        Indice: 13
    }
    const response = await fetch(urlGeneral, DataFetch(data, 'POST')).then(res => res.json())
    var jsonData = response['dt0'];

    $(selectEstado).empty();

    const labelTodo = document.createElement('label');
    labelTodo.classList.add('ExtensCheck')
    labelTodo.setAttribute('data-codestado', 0)

    labelTodo.innerHTML = `
        <article href="#" class="small" value="0" data-value="option1" tabindex="-1">
            <input class="check-estado" type="checkbox"/> TODOS
            <span class="CheckMK"></span>
        </article>`;

    labelTodo.querySelector('.check-estado').addEventListener('click', (e) => funcionEstadoTodos($(e.target), 1));
    selectEstado.appendChild(labelTodo);
    
    $.each(jsonData, function () {
        const label = document.createElement('label');
        label.classList.add('ExtensCheck')
        label.setAttribute('data-codestado', this.CodEstado)

        label.innerHTML = `
            <article href="#" class="small" value="0" data-value="option1" tabindex="-1">
                <input class="check-estado" type="checkbox" ${[9, 18].includes(this.CodEstado) ? 'checked' : ''} /> ${this.NomEstado}
                <span class="CheckMK"></span>
            </article>`;

        label.querySelector('.check-estado').addEventListener('click', (e) => funcionEstadoTodos($(e.target), 2))

        selectEstado.appendChild(label);
    })
    funcionEstadoTodos();
}

/* //2da Forma para ejecutar una funcion
    window.funcionEjemplo = () => {}
*/

async function cargarClientes() {
    const request = ['ProcCliente', '' , 12];
    const response = await util.obtenerDatosBD(...request);
    const clientes = response['dt0'];
    let strOptions = '<option value="0">--Todos--</option>';

    clientes.forEach((c, i) => {
        strOptions += `<option value="${c.CodCliente}">${c.NomCliente}</option>`
    })

    selectFiltroCliente.innerHTML = strOptions;
    $('#select-filtro-cliente').select2();
}

function funcionEstadoTodos(elemento, tipo) {
    if (tipo == 1) {
        var estadoTodos = elemento.prop('checked');
        $.each($('#select-estado > label'), function () {
            var inputActivo = $(this).find('article').find('input');
            if (estadoTodos) {
                inputActivo.prop('checked', 'checked');
            } else {
                inputActivo.prop('checked', '');
            }
        });
    } else {
        var cantidadChekeada = 0;
        $.each($('#select-estado > label'), function (index) {
            var inputActivo = $(this).find('article').find('input').prop('checked');
            if (inputActivo && index != 0) {
                cantidadChekeada++;
            }
        });
        if ($('#select-estado > label').length - 1 == cantidadChekeada) {
            $('#select-estado').find('label').eq(0).find('article').find('input').prop('checked', 'checked');
        } else {
            $('#select-estado').find('label').eq(0).find('article').find('input').prop('checked', '');
        }
    }
}

function obtenerCadenaEstado(selectEstado) {
    let cadenaEstados = ''; //
    
    $.each($(`#${selectEstado} > label`), function () {
        var codEstado = $(this).attr('data-codEstado');
        var inputActivo = $(this).find('article').find('input').prop('checked');
        if (codEstado != 0 && inputActivo) {
            cadenaEstados += codEstado + ',';
        }
    });

    if (cadenaEstados == '') {
        ObjUtil.MostrarMensaje('Tiene que seleccionar mínimo un estado', 0);
        $('#iconCargar').css('display', 'none');
        return "";
    } else {
        cadenaEstados = cadenaEstados.substring(0, cadenaEstados.length - 1);
    }

    return cadenaEstados
}

function submitsEncry(text, accion) {

    var textoConvertir = '';

    var key = CryptoJS.enc.Utf8.parse('8080808080808080');
    var iv = CryptoJS.enc.Utf8.parse('8080808080808080');

    if (accion == 'encrypt') {
        textoConvertir = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key,
            {
                keySize: 128 / 8,
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
    } else if (accion == 'decrypt') {
        textoConvertir = CryptoJS.AES.decrypt(CryptoJS.enc.Utf8.parse(text), key,
            {
                keySize: 128 / 8,
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
        var bytes = CryptoJS.AES.decrypt(ciphertext.toString(), text);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } else {
        textoConvertir='Elija entre "encrypt"  o "decrypt"'
    }
    return textoConvertir;
}