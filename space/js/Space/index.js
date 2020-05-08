/*
 *  space submodule in charge of working the cytoscape stuff
 */

import getStyle from './style'
import utils from './utils'

export default function createSpace(vm, nodes) {
  let cy = cytoscape({
    container: document.getElementById("deck-space"),
    elements: utils.transformNodes(vm.$data, nodes),
    style: getStyle(vm.$data),
    layout: {
      name: "preset",
      fit: true,
      padding: 20,
      ready: utils.layoutReady
    },
    autolock: true
  })

  // events binding
  cy.on("select", (e) => vm.selectNode(e.target.id()))
  cy.on("unselect", () => vm.selectNode(vm.deckSlug))
  cy.on("zoom", utils.syncZoomNodeSize)

  document.addEventListener("keypress", utils.keyPressZoom(cy, vm.deckSlug))

  return cy
}
