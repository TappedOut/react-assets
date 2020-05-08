/*
* style of the space canvas
*/

let colorToHTML = {
  B: "#150B00",
  C: "#43464B",
  G: "#00733E",
  R: "#D3202A",
  U: "#0E68AB",
  W: "#F8E7B9"
}

export default function getStyle(data) {
  let nodes = Object.values(data.nodes)

  let baseStyle = [
    {
      selector: "node",
      style: {
        "border-color": "#AAAAAA"
      }
    },
    {
      selector: ":selected",
      style: {
        "border-color": "#FFFFFF",
        "shape": "square"
      }
    }
  ]

  let nodeStyle = nodes.map((node) => {
    if (node.mana_colors.length === 0) {
      return {
        selector: "#" + node.slug,
        style: {
          "background-color": colorToHTML["C"]
        }
      }
    } else if (node.mana_colors.length === 1) {
      return {
        selector: "#" + node.slug,
        style: {
          "background-color": colorToHTML[node.mana_colors[0]]
        }
      }
    }

    return {
      selector: "#" + node.slug,
      style: {
        "background-fill": "linear-gradient",
        "background-gradient-stop-colors": node.mana_colors.reduce(
          (a, v) => `${a} ${colorToHTML[v]}`, ""),
        "background-blacken": node.luminosity,
        "background-opacity": node.opacity,
        "border-opacity": node.opacity,
        "z-index": node.index
      }
    }
  })

  let centerNodeStyle = [
    {
      selector: "#" + data.deckSlug,
      style: {
        "border-color": "#FFFFFF",
        "border-opacity": 1,
        "shape": "triangle",
        "z-index": nodes.length + 1
      }
    }
  ]

  return [...baseStyle, ...nodeStyle, ...centerNodeStyle]
}
