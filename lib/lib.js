import {
    Meteor
}
from 'meteor/meteor';

//////
// Globals
//////
/* global BlazeLayout FlowRouter  */
/* global Tree TreeSize */

Tree = new Mongo.Collection('tree');
TreeSize = new Mongo.Collection('treeSize');

//////
// Routing
//////
FlowRouter.subscriptions = function() {

    this.register('trees', Meteor.subscribe('trees', function onReady() {
        Session.set('treesLoaded', true);
        console.log("Set trees loaded to True Globally");
    }));

    this.register('treeSizes', Meteor.subscribe('treeSizes', function onReady() {
        Session.set('treeSizesLoaded', true);
        console.log("Set treeSizes loaded to True Globally");
    }));
};




FlowRouter.route('/', {
    // do some action for this route
    action: function(params, queryParams) {
        //////
        // Assign Routes
        //////
        BlazeLayout.setRoot('body'); // Templates will be rendered into the HTML 'body'
        BlazeLayout.render("mainLayout", {
            top: "header",
            treeDisplay: "homeTreeDisplay"
        });
    },

    name: "display_nyc_trees" // optional
});
