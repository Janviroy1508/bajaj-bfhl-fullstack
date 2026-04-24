const express = require("express");
const cors = require("cors");

const USER_ID = "JANVIROY_15082005";
const EMAIL_ID = "jr1428@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311003011332";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("BFHL API is running. Use POST /bfhl");
});
app.get("/bfhl", (req, res) => {
  res.send("Use POST request on /bfhl");
});

function trimInputs(data) {
  return data.map(item => String(item).trim());
}

function validateEdge(str) {
  const match = str.match(/^([A-Z])->([A-Z])$/);
  if (!match) return false;
  return match[1] !== match[2];
}

function separateValidAndInvalid(items) {
  let validEdges = [];
  let invalidEntries = [];

  for (let item of items) {
    if (validateEdge(item)) validEdges.push(item);
    else invalidEntries.push(item);
  }

  return { validEdges, invalidEntries };
}

function deduplicateEdges(validEdges) {
  let seen = new Set();
  let acceptedEdges = [];
  let duplicateSet = new Set();

  for (let edge of validEdges) {
    if (!seen.has(edge)) {
      seen.add(edge);
      acceptedEdges.push(edge);
    } else {
      duplicateSet.add(edge);
    }
  }

  return {
    acceptedEdges,
    duplicateEdges: [...duplicateSet]
  };
}

function buildGraph(edges) {
  let childrenMap = {};
  let allNodes = new Set();
  let childNodes = new Set();

  for (let edge of edges) {
    let [parent, child] = edge.split("->");

    if (!childrenMap[parent]) childrenMap[parent] = [];
    childrenMap[parent].push(child);

    allNodes.add(parent);
    allNodes.add(child);
    childNodes.add(child);
  }

  for (let key in childrenMap) {
    childrenMap[key].sort();
  }

  return { childrenMap, allNodes, childNodes };
}

function buildTree(node, childrenMap) {
  let obj = {};

  if (!childrenMap[node]) return {};

  for (let child of childrenMap[node]) {
    obj[child] = buildTree(child, childrenMap);
  }

  return obj;
}

function calcDepth(node, childrenMap) {
  if (!childrenMap[node]) return 1;

  let depths = childrenMap[node].map(child =>
    calcDepth(child, childrenMap)
  );

  return 1 + Math.max(...depths);
}

app.post("/bfhl", (req, res) => {
  if (!req.body.data || !Array.isArray(req.body.data)) {
    return res.status(400).json({
      error: "Invalid request. data must be an array."
    });
  }

  const trimmed = trimInputs(req.body.data);

  const { validEdges, invalidEntries } =
    separateValidAndInvalid(trimmed);

  const { acceptedEdges, duplicateEdges } =
    deduplicateEdges(validEdges);

  const { childrenMap, allNodes, childNodes } =
    buildGraph(acceptedEdges);

  let roots = [...allNodes].filter(n => !childNodes.has(n)).sort();

  let hierarchies = [];

  for (let root of roots) {
    let tree = {};
    tree[root] = buildTree(root, childrenMap);

    hierarchies.push({
      root,
      tree,
      depth: calcDepth(root, childrenMap)
    });
  }

  let largest = "";

  if (hierarchies.length > 0) {
    hierarchies.sort((a, b) =>
      b.depth - a.depth || a.root.localeCompare(b.root)
    );
    largest = hierarchies[0].root;
  }

  res.json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: hierarchies.length,
      total_cycles: 0,
      largest_tree_root: largest
    }
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
