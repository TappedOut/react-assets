import createSpace from './Space'
import spaceTemplate from './Templates/space.html'
import utils from './utils'

document.getElementById("deck-space-template").innerHTML = spaceTemplate

window.vm = new Vue({
  el: "#deck-space-app",
  data: {
    currentNodeId: null,
    deckSlug: window.location.href.split("/")[4],
    nodes: {},
    positionMultiplier: 100
  },
  computed: {
    currentNode: function () {
      return this.currentNodeId ? this.nodes[this.currentNodeId] : null
    }
  },
  methods: {
    centerSpace: function () {
      this.cy.fit(null, 20)
    },
    selectNode: function (nodeId) {
      this.currentNodeId = nodeId;
    }
  },
  mounted() {
    axios
      .get(`/api/decks/${this.deckSlug}/space/`)
      .then((response) => {
        this.nodes = utils.setupNodes(response.data)
        this.currentNodeId = this.deckSlug
        this.cy = createSpace(this, response.data.nodes)
      })
  },
  template: "#deck-space-template"
})
