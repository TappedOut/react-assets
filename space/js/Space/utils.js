/*
* utils file of the Space module
*/

function keyPressZoom(cy, deckSlug) {
  function getCenterNode() {
    let centerNode = cy.$(":selected")

    if (centerNode.length > 0) {
      return centerNode.position()
    } else {
      return cy.getElementById(deckSlug).position()
    }
  }

  return (event) => {
    if (event.code === "Equal") {
      event.preventDefault()
      cy.zoom({
        level: cy.zoom() * 1.5,
        position: getCenterNode()
      })
    } else if (event.code === "Minus") {
      event.preventDefault()
      cy.zoom({
        level: cy.zoom() / 1.5,
        position: getCenterNode()
      })
    }
  }
}

function layoutReady(e) {
  syncZoomNodeSize(e)
  e.cy.minZoom(e.cy.zoom())
  e.cy.maxZoom(e.cy.zoom() * 20)
}

function syncZoomNodeSize(e) {
  var dim = 10 / e.cy.zoom()

  e.cy.$("node").css({
      "width": dim,
      "height": dim,
      "border-width": dim / 10,
      "font-size": dim,
      "text-opacity": 1,
      "overlay-padding": dim / 2
  })
}

function transformNodes(data, nodes) {
  return nodes.map(
    (node) => {
      return {
        group: "nodes",
        data: {
          id: node.slug
        },
        position: {
          x: node.x * data.positionMultiplier,
          y: node.y * data.positionMultiplier
        },
        selected: node.slug === data.deckSlug,
        selectable: true
      }
    }
  )
}

export default {
  keyPressZoom,
  layoutReady,
  syncZoomNodeSize,
  transformNodes
}
