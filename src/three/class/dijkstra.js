let extractKeys = function (obj) {
  let keys = [];
  for (let key in obj) {
    Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
  }
  return keys;
};

let sorter = function (a, b) {
  return parseFloat(a) - parseFloat(b);
};

let findPaths = function (map, start, end, infinity) {
  infinity = infinity || Infinity;

  let costs = {},
    open = { 0: [start] },
    predecessors = {};
  let keys;

  var addToOpen = function (cost, vertex) {
    var key = "" + cost;
    if (!open[key]) open[key] = [];
    open[key].push(vertex);
  };

  costs[start] = 0;

  while (open) {
    if (!(keys = extractKeys(open)).length) break;

    keys.sort(sorter);

    var key = keys[0],
      bucket = open[key],
      node = bucket.shift(),
      currentCost = parseFloat(key),
      adjacentNodes = map[node] || {};

    if (!bucket.length) delete open[key];

    for (var vertex in adjacentNodes) {
      if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
        var cost = adjacentNodes[vertex],
          totalCost = cost + currentCost,
          vertexCost = costs[vertex];

        if (vertexCost === undefined || vertexCost > totalCost) {
          costs[vertex] = totalCost;
          addToOpen(totalCost, vertex);
          predecessors[vertex] = node;
        }
      }
    }
  }

  if (costs[end] === undefined) {
    return null;
  } else {
    return predecessors;
  }
};

let extractShortest = function (predecessors, end) {
  let nodes = [],
    u = end;

  while (u !== undefined) {
    nodes.push(u);
    u = predecessors[u];
  }

  nodes.reverse();
  return nodes;
};

let findShortestPath = function (map, nodes) {
  let start = nodes.shift(),
    end,
    predecessors,
    path = [],
    shortest;

  while (nodes.length) {
    end = nodes.shift();
    predecessors = findPaths(map, start, end);

    if (predecessors) {
      shortest = extractShortest(predecessors, end);
      if (nodes.length) {
        path.push.apply(path, shortest.slice(0, -1));
      } else {
        return path.concat(shortest);
      }
    } else {
      return null;
    }

    start = end;
  }
};

let toArray = function (list, offset) {
  try {
    return Array.prototype.slice.call(list, offset);
  } catch (e) {
    let a = [];
    for (var i = offset || 0, l = list.length; i < l; ++i) {
      a.push(list[i]);
    }
    return a;
  }
};

class Graph {
  constructor(map) {
    this.map = map;
  }
  findPath = function (start, end) {
    if (Object.prototype.toString.call(start) === "[object Array]") {
      return findShortestPath(this.map, start);
    } else if (arguments.length === 2) {
      return findShortestPath(this.map, [start, end]);
    } else {
      return findShortestPath(this.map, toArray(arguments));
    }
  };
}

export { Graph };
