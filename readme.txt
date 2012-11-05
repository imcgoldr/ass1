Waterford Institute of Technology
Mobile Web Development
Assignment #1

Ian McGoldrick (Student Number 20037512)

This readme.txt file gives an overview of the design and implementation of 
assignment 1 - a Backbone.js based ToDo appllication/site.

I tested the system with 1000 todo parent lists and it was pretty performant.

The site was tested on an HTC Desire with Android 2.2 and an iPad 2.

The site is deployed to Amazon and can be activated if requested.

Source code available: https://github.com/imcgoldr/ass1

_Environment_

The site requires the following environment to be in place in addition to those artifacts included in the zip
file submitted:

(a) ngnix (v1.0.11) - passthrough for node.js for /api/ setup for port 8180
(b) node.js (v0.6.8) - server is /ass1/node/lib/ass1-server.js
(c) mongodb (v2.0.7) - listening on port 27017.  There must be a user collection defined and populated for
    login so please execute the following from the mongodb shell: db.user.insert({"user" : "ian", "pw" : "secret" })
    prior to logging into the apaplication
(d) memcached (v1.2.4) - listening on port 11211 (memcached -vv -p 11211) [optional]

_Design_

The starting point for the site was the last stage of the week 3 lab, bb-h.html, bb,css & bb-h.js

The site is based on 4 jquery-mobile pages, welcome (i.e. login), main (i.e. the lists), settings and map.

The welcome page is the default page.  It has an associated view and model, User & Welcome.
The model is used to allow for query of user details from the server and the view controls the switch to 
the main todo list view if the login details are valid.  Transition to the main view is via the router entry 'main'.
Settings are grabbed from localstorage to set the theme of the login page (one of the built-in jquery mobile
themes).  The validation of the login fetches from the server, there is a downside to this that the username and pw 
are included in the GET... this would not be the approach in a real-world/production application.

The ToDo lists are generated and managed by the Header and List models and views.  On login if the user is 
valid then the server is again queried for the items belonging to that user, this allows for multiple users
who can maintain their own personal/private lists.  On loading of the initial list ToDo items with an 
ownerId of zero are loaded, i.e. they are parent items and can therefore have child lists.
The Header view controls the display of the buttons, bugs from the Lab02 version of ToDo in relation to the 
display of buttons based on state have been fixed.
When a new item is being added the geolocation is grabbed and stored with the item if it can be obtained.
When a new item is saved it is appended to the Items collection.  Since the List View is listening to this 
it is appended in the DOM also.
The Back button is enabled when showing a subordinate list, therefore Back re-queries the server for the parent
list.
The header is configured so that when showing a subordinate list it displays the name of the parent list,
also when showing the primary list it displays the Details button on each item.

The List view uses the Items view to setup each item.  This includes requery of the collection when the user 
chooses 'Details' using the id of the item as the ownerId.

There is a map view facility provided if coordinates are saved when the user taps the item text, this uses the
map view to set the map img attribute and manage the transition back to the view via the router.

The settings page, model and view handles the selection of the theme.  I used a function I found in GitHub to
apply the theme selected as just setting the data-theme in the DOM didn't have the desired result.
There is model support for the theme setting, this could be extended for other settings.  Settings are maintained
in LocalStorage.

I included a simplistic testbed for the caching on the server in the Item model - commented out.

The server code implements the REST API for the backbone calls,  It utilises mongodb and memcached.
API support for User and ToDo items are provided.  The todo.delete function handles removal of child items if a 
parent is being removed.



