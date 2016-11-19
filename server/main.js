/* Server Side main.js */
import {
    Meteor
}
from 'meteor/meteor';
import fs from 'fs';
//////
// Globals
//////
/* global Tree, TreeSize */

/* Red in the NYC Tree data JSON file */
/* Base Directory For Images */
var baseDir = process.env.PWD;
var treeDataFile = baseDir + "/input/json/city_trees.json";
var colNames = ['tree_id', 'species_scientific_name', 'species_common_name', 'form', 'growth_rate', 'fall_color', 'environmental_tolerances', 'location_tolerances', 'notes_suggested_cultivars', 'tree_size', 'comments'];
var treeCt = 0;

Meteor.startup(() => {
    // code to run on server at startup
//    Tree.remove({});
//    TreeSize.remove({});
    if (!Tree.findOne({})) {

        var data = fs.readFileSync(treeDataFile, "utf-8");

        //var treeObjs = JSON.parse(data);
        JSON.parse(data).forEach(tree => {
            var newTree = {};
            tree.forEach((col, idx) => {
                if (idx == 9) {
                    var size = getAndInsertSize(col);
                    newTree[colNames[idx]] = size;
                }
                else {

                    newTree[colNames[idx]] = col;
                }
            });
            // treeSpecs.push(newTree);
            Tree.insert(newTree);
            treeCt++;
        });
        console.log(`Planted ${treeCt} trees!`);
    }
    else {
        console.log("Trees are already planted!");
    }
});

/* Get tree size data and insert some Size specifiic data to the 'treeSize' collection */
function getAndInsertSize(heightCol) {
    var sizeStr;
    var gtLtRex  = /^(\w+).+(<|>|=)\s?(\d+)/;
    var rangeRex = /^(\w+).+(\d+)\-(\d+)/;
    var treeSize = {};

    var match  = gtLtRex.exec(heightCol);
    var match2 = rangeRex.exec(heightCol);
    if (match) {
        sizeStr = match[1];
        //console.log("Size: " + sizeStr);
        treeSize.size = sizeStr;
        //console.log("Comparison Operator: " + match[2]);
        treeSize.compOperator = match[2];
        //console.log("Comparison Number: " + match[3]);
        treeSize.compNumber = match[3];
    }
    else if (match2) {
        sizeStr = match2[1];
        //console.log("Size: " + sizeStr);
        treeSize.size = sizeStr;
        //console.log("Range Lower: " + match2[2]);
        treeSize.lowRange = match2[2];
        //console.log("Range Upper: " + match2[3]);
        treeSize.highRange = match2[3];
    }
    else {
        console.log("No Match for : " + heightCol);
    }

    if (!TreeSize.findOne({
            size: sizeStr
        })) {
        TreeSize.insert(treeSize);
        //console.log("Inserting Size : " + sizeStr);
    }
    else {
        //console.log("No need to insert size : " + sizeStr);
    }
    return sizeStr;
}

/* 
 *  Publisher 
 */
Meteor.publish("trees", function() {
    return Tree.find();
});

Meteor.publish("treeSizes",function(){
    return TreeSize.find();
})