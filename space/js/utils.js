/*
* utils module
*/

export function setupNodes(args) {
  let { nodes, luminosity, opacity, index } = args

  return nodes.reduce((acc, node) => {
      acc[node.slug] = {
        ...node,
        luminosity: luminosity[node.votes],
        opacity: opacity[node.votes],
        index: index[node.votes]
      }
      return acc
    },
    {}
  );
}

export default {
  setupNodes
}
