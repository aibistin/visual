/* Client side main.js */
import {
    Template
}
from 'meteor/templating';
import {
    ReactiveVar
}
from 'meteor/reactive-var';
import vis from 'vis';
import 'vis/dist/vis.css';
import moment from 'moment';

import './main.html';

//Meteor.subscribe("trees");
//Meteor.subscribe("treeSizes");
/*
Meteor.subscribe('trees', function onReady() {
    Session.set('treesLoaded', true);
});

Meteor.subscribe('treeSizes', function onReady() {
    Session.set('treeSizesLoaded', true);
});
*/
//////
// Globals
//////
/* global Tree TreeSize  $ */
var visNetObj;
var displayTypeText = "All Approved Tree Types";

//////
// Template Helpers
//////


/*
"tree_id"
        "species_scientific_name"
        "species_common_name"
        "form"
        "growth_rate"
        "fall_color"
        "environmental_tolerances"
        "location_tolerances"
        "notes_suggested_cultivars"
        "tree_size"
        "comments"
*/

Template.homeTreeDisplay.helpers({
    "allTreeDataLoaded": function() {
        return isAllTreeDataLoaded();
    },
    "treeData": function() {
        var allTreeVis = createTreeDisplay();
        if (allTreeVis) {
            allTreeVis.fit();
        }else{
            return "Loading...."
        }
        
        return '';
    }
});

Template.header.helpers({
    'displayTitle': function() {
        return displayTypeText;
    }
});
/////
// Template Events
//////

Template.selectorButtons.events({
    'click button[name^=display-]': function(event) {
        var buttonName = $(event.target).attr('name');
        var buttonText = $(event.target).text();
        //console.log("Button name: " + buttonName);
        //console.log("Button Text: " + buttonText);
        var sizeRx = /^(\w+)\s/;
        var res = sizeRx.exec(buttonText);
        if (!res) {
            console.log(`Button text, ${buttonText}, is invalid!`);
            return false;
        }
        var selectSize = res[1];

        var displayTypeText = "All Approved Tree Types";
        //console.log(`Looking for ${selectSize} Trees Only!`);
        if (selectSize === 'All') {
            selectSize = false;
            displayTypeText = "All Approved Tree Types";
        }
        else {
            displayTypeText = selectSize + " Approved Tree Types";
        }
        
        $("#disp-title").text(displayTypeText);

        var treeVis = createTreeDisplay({
            selectedSize: selectSize
        });

        if (treeVis) {
            treeVis.fit();
        }
    }
});

/* 
    Utility Functions 
*/

/* Create the vis Network Display Obj */
function createTreeDisplay(params) {
    var selectedSize;
    if (params) {
        selectedSize = params.selectedSize
    }
    if (isAllTreeDataLoaded) {
        console.log("Tree data is loaded");
    }
    else {
        console.log("Tree data is Not loaded!");
    }
    var treeCt = Tree.find({}).count();
    var trees = Tree.find({});
    //console.log("Tree Count: " + treeCt);
    // Wait for trees to fully load
    if (treeCt < 50) {
        return false;
    }

    var itemsEdges = loadItemsEdges(trees, params);
    if (!itemsEdges) {
        return false;
    }

    var items = itemsEdges.items;

    var treeEdges = itemsEdges.treeEdges;

    var nodes = new vis.DataSet(items);
    var edges = new vis.DataSet(treeEdges);
    var data = {
        nodes: nodes,
        edges: edges,
    };
    // console.log("Data: " + JSON.stringify(data));
    var options = getOptions();
    var container = document.getElementById('2d-vis');
    visNetObj = new vis.Network(container, data, options);
    //console.log("Network Vis Obj: " + visNetObj);

    /* 
    visNetObj.on("click", function(params) {
        params.event = "[Hey There Hey]";
        //for (var p in params){
        //    console.log("Param: " + JSON.stringify(p));
        //}
        document.getElementById('displayStuff').innerHTML = '<h2>Click event:</h2>' + JSON.stringify(params, null, 4);
        if (params.nodes){
            var nodeNo = params.nodes;
            console.log("Nodes: " + nodeNo );
            var thisTree = Tree.find({ "tree_id": nodeNo}).fetch();
            console.log("This Tree: " + JSON.stringify(thisTree,null,4));
            var cssColor = getFallColor(thisTree.fall_color);
             $('body').css('background-color', cssColor + ' !important'); 
        }
    });
*/
    return visNetObj;
}

// Get 'min' and 'max' tree size
function getMinMaxSize(sizeD) {
    var lowRange, highRange;
    if (!sizeD) {
        return false;
    }

    if (sizeD.hasOwnProperty("compOperator")) {
        if (sizeD.compOperator === '<') {
            lowRange = 0;
            highRange = sizeD.compNumber;
        }
        else {
            lowRange = sizeD.compNumber;
            highRange = 100;
        }
    }
    else if (sizeD.hasOwnProperty("lowRange")) {
        lowRange = sizeD.lowRange;
        highRange = sizeD.highRange;
    }
    else {
        console.log("Error! No comp Operator or size range!!");
    }

    return {
        min: lowRange,
        max: highRange
    };
}

function isAllTreeDataLoaded() {
    var treesL = Session.get('treesLoaded');
    var treesSl = Session.get('treeSizesLoaded');
    return (treesL && treesSl);
}

function createTitleDialogue(tree) {
    return "<dl>" +
        "<dt>Name: </dt><dd>" + tree.species_common_name + "</dd>" +
        "<dt>Sceintific Name: </dt><dd>" + tree.species_scientific_name + "</dd>" +
        "<dt>Form: </dt><dd>" + tree.form + "</dd>" +
        "<dt>Growth Rate: </dt><dd>" + tree.growth_rate + "</dd>" +
        "<dt>Fall Color: </dt><dd>" + tree.fall_color + "</dd>" +
        "<dt>Environmental Tolerances: </dt><dd>" + tree.environmental_tolerances + "</dd>" +
        "<dt>Location Tolerances: </dt><dd>" + tree.location_tolerances + "</dd>" +
        "<dt>Notes Suggested Cultivars: </dt><dd>" + tree.notes_suggested_cultivars + "</dd>" +
        "<dt>Size: </dt><dd>" + tree.tree_size + "</dd>" +
        "<dt>Comments: </dt><dd>" + tree.comments + "</dd>" +
        "</dl>";
}

function getTreeShape(tree) {
    var nodeShape;
    // console.log("Tree Form: <" + tree.form + ">");

    switch (tree.form) {
        case "Pyramidal":
            nodeShape = "triangle";
            break;
        case "Upright":
            nodeShape = "box";
            break;
        case "Rounded":
            nodeShape = "circle";
            break;
        case "Vase-Like":
            nodeShape = "triangleDown";
            break;
        default:
            nodeShape = "triangleDown";
     //       console.log("Missing Form: " + tree.species_common_name);
    }
    return nodeShape;
}

/* Convert a fall color into CSS */
function getFallColor(tree) {
    var dispColor;
    //console.log("Tree Form: <" + tree.fall_color + ">");

    switch (tree.fall_color) {
        case "Red/Bronze":
            dispColor = "#CD7F32";
            break;
        case "Purple/Maroon":
            dispColor = "#9F00C5";
            break;
        case "Maroon":
            dispColor = "#800000";
            break;
        case "Yellow/Orange":
            dispColor = "#FFA500";
            break;
        case "Orange/Brown":
            dispColor = "#CC5500"; //burned orange
            break;
        default:
            dispColor = tree.fall_color;
            //console.log("Missing Color: " + tree.species_common_name);
    }
    return dispColor;
}

/*
 * Load Items and Edges for All or specific tree sizes
 */
function loadItemsEdges(trees, params) {
    var selectedSize, fallColors, treeForm, growthRate;
    if (params) {
        selectedSize = params.selectedSize;
        treeForm = params.form;
        growthRate = params.growthRate;
        fallColors = params.fallColors;
    }

    var items = [];
    var treeEdges = [];
    /* Saving Previous Edge with same Value */
    var gRateSave = {};
    var fColorSave = {};
    var fSave = {};
    var nodeFallColors = [];

    trees.forEach(tree => {
        if (selectedSize && (tree.tree_size !== selectedSize)) {
            //console.log("Tree Size: " + tree.tree_size + " != " + selectedSize);
            return;
        }
        var treeDimensions = TreeSize.findOne({
            size: tree.tree_size
        });

        /* console.log("Tree Size: " + JSON.stringify(treeDimensions)); */
        if (!treeDimensions) {
            //console.log("No Tree Dimensions for tree: " + tree.species_common_name);
            return;
        }

        var minMax = getMinMaxSize(treeDimensions);
        if (!minMax) {
            console.log("No Min/Max for tree: " + tree.species_common_name);
        }

        var treeTitle = createTitleDialogue(tree);

        // console.log("Min/Max Size: " + JSON.stringify(minMax)); 
        var nodeShape = getTreeShape(tree);

        /* Build the Nodes */
        items.push({
            id: tree.tree_id,
            label: tree.species_common_name,
            title: treeTitle,
            value: minMax.max,
            // size: minMax.max,
            shape: nodeShape,
            //shadow: true,
            group: tree.tree_size
        });
        
        /* Collect Fall Colors */
        var cssColor = getFallColor(tree.fall_color);
        nodeFallColors.push({ fallColor: cssColor });
        
        if (growthRate) {
            connectGrowthRate(tree, treeEdges, gRateSave);
        }
        if (fallColors) {
            connectFallColors(tree, treeEdges, fColorSave);
        }
        if (treeForm) {
            connectForm(tree, treeEdges, fSave);
        }
    });
    
        Session.set('', true);
    if (items.length > 0) {
        return {
            "items": items,
            "treeEdges": treeEdges
        };
    }
    return null;
}


/*
 * Build Edges
 */

function connectGrowthRate(tree, treeEdges, gRateSave) {

    /* Connect "Slow" to "Slow" etc */
    if (gRateSave[tree.growth_rate]) {
        treeEdges.push({
            from: tree.tree_id,
            to: gRateSave[tree.growth_rate],
            label: tree.growth_rate,
            title: tree.growth_rate,
            color: 'orange',
            width: 3
        });
    }
    gRateSave[tree.growth_rate] = tree.tree_id;
}

function connectFallColors(tree, treeEdges, fColorSave) {
    if (fColorSave[tree.fall_color]) {
        treeEdges.push({
            from: tree.tree_id,
            to: fColorSave[tree.fall_color],
            label: tree.fall_color,
            title: tree.fall_color,
            color: 'black',
            width: 3
        });
    }
    fColorSave[tree.fall_color] = tree.tree_id;
}

function connectForm(tree, treeEdges, fSave) {
    if (fSave[tree.form]) {
        treeEdges.push({
            from: tree.tree_id,
            to: fSave[tree.form],
            label: tree.form,
            title: tree.form,
            color: 'blue',
            width: 3
        });
    }
    fSave[tree.form] = tree.tree_id;
}

function getOptions() {
    var treeGroupStyles = getTreeGroupStyles();
    return {
        autoResize: true,
        height: '600px',
        // width: '700px',
        //  height: '100%',
        //  width: '100%',
        groups: treeGroupStyles,
        nodes: {
            font: {
                size: 14, // px
                //face: 'arial',
                background: 'none',
                // strokeWidth: 0, // px
                //strokeColor: '#ffffff',
                align: 'center'
            },
            labelHighlightBold: true,
        },
    };
}

function getTreeGroupStyles() {
    return {
        "Large": {
            color: {
                background: '#228B22'
            },
            className: 'text-success',
            borderWidth: 1
        },
        "Medium": {
            color: {
                background: '#00BFFF'
            },
            className: 'text-primary',
            borderWidth: 1
        },
        "Intermediate": {
            color: {
                background: 'red'

            },
            className: 'text-success',
            borderWidth: 1
        },
        "Small": {
            color: {
                background: 'yellow'
            },
            className: 'text-warning',
            borderWidth: 0.5
        }
    };

}
