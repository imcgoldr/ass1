/*
TODO:

- Add login
- Add location
- Add server

- Get rid of ownerId global

*/

function pd( func ) {
  return function( event ) {
    event.preventDefault()
    func && func(event)
  }
}

document.ontouchmove = pd()

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g,
  escape:      /\{\{-(.+?)\}\}/g,
  evaluate:    /\{\{=(.+?)\}\}/g
};

var browser = {
	android: /Android/.test(navigator.userAgent)
}
browser.iphone = !browser.android

var app = {
  model: {},
  view: {}
}

var bb = {
  model: {},
  view: {}
}


bb.init = function() {

  var saveon = false
  var swipeon = false
  var toplevel = true
  var ownerId = 0
  
  var scrollContent = {
    scroll: function() {
      var self = this
      setTimeout( function() {
        if( self.scroller ) {
          self.scroller.refresh()
        }
        else {
          self.scroller = new iScroll( $("div[data-role='content']")[0] )
        }
      },1)
    }
  }
  
  var myRouter = Backbone.Router.extend({
    routes : {
	  '': 'doMain',
	  'settings' : 'showSettings'
	},
	doMain : function() {
		console.log('myRouter:doMain')
		$('div#settings').hide();
		$('div#main').show();
	},
	showSettings : function() {
		console.log('myRouter:doMain')
		$('div#main').hide();
		$('div#settings').show();
	}
  });
  // As per bb documentation need to create a router and call history.start()
  bb.router = new myRouter()
  Backbone.history.start()
  
  bb.view.Head = Backbone.View.extend(_.extend({
	events: {
	  'tap #gosettings': 'showSettings',
	  'tap #add': 'addItem',
	  'tap #cancel': 'cancelItem',
	  'tap #back': 'showTopLevel',
	  // touchend added for Android
	  'touchend #save': 'saveItem',
	  // click for now so that desktop works, but needs to be tested for Apple (also applies to other view events)
	  'click #save': 'saveItem',
	  'keyup #text': 'activateSave'
    },
    initialize: function(items) {
	  console.log('view.Head:initialize:begin')
      var self = this
      _.bindAll(self)

	  self.items = items

      self.setElement("div[data-role='header']")
	  self.elements = {
	    settings: self.$el.find('#gosettings'),
	    title: self.$el.find('#maintitle'),
		add: self.$el.find('#add'),
		cancel: self.$el.find('#cancel'),
		back: self.$el.find('#back')
      }
	  self.setElement("div[data-role='content']")
	  self.elements.newitem = self.$el.find('#newitem')
	  self.setElement('#newitem')
	  self.elements.text = self.$el.find('#text')
	  self.elements.save = self.$el.find('#save')

	  self.elements.settings.hide()
	  self.elements.add.hide()
	  self.elements.cancel.hide()

	  // TODO: With LocalStorage View.Head rendering is not efficient when we switch between lists, for every element in the list being loaded
	  // head is rerendered (i.e. wasteful).
	  // When plugin the server see if we can raise & listen for a different event when the model list is loaded
	  self.items.on('add',self.render)
	  self.items.on('remove',self.render)	  
	  app.model.state.on('change',self.render)

	  self.tm = {
        heading: _.template( self.elements.title.html() )
      }
	  console.log('view.Head:initialize:end')
    },
	
	render: function() {
	  console.log('view.Head:render:begin')
	  var self = this
	  
	  var loaded = 'loaded' == app.model.state.get('items_state')
	  self.elements.title.html( self.tm.heading( {title: loaded ? 'To Do: '+self.items.length+' Items' : 'To Do: Loading...'} ))
	  // Handle display of Header items based on flags
	  if (loaded) {
	    if (saveon || swipeon) {
	      self.elements.settings.hide()
	      self.elements.add.hide()
		  self.elements.back.hide()
	      self.elements.cancel.show()
		}
		else {
	      self.elements.add.show()
	      self.elements.cancel.hide()
		  if (toplevel) {
		    self.elements.back.hide()
		    self.elements.settings.show()
		  }
		  else {
		    self.elements.back.show()
		    self.elements.settings.hide()
		  }
		}
		if (saveon) {
          self.elements.newitem.slideDown()
		}
		else {
	      self.elements.text.val('').blur()
          self.elements.newitem.slideUp()
		}
		if (toplevel) {
	      $('.details').show()
		}
		else {
	      $('.details').hide()
		}
		if (swipeon) {
	      $('.details').hide()
		}
		else {
	      $('.delete').hide()
		}
	  }
	  console.log('view.Head:render:end')
	},

    showSettings: function() {
	  console.log('view.Head:showSettings:begin')
	  var self = this

	  bb.router.navigate('settings', {trigger: true});
	  console.log('view.Head:showSettings:end')
	  return false
	},
	
    addItem: function() {
	  console.log('view.Head:addItem:begin')
	  var self = this

	  saveon = true
	  self.render()
      self.activateSave()
	  console.log('view.Head:addItem:end')
	  return false
	},
	
    cancelItem: function() {
	  console.log('view.Head:cancelItem:begin')
	  var self = this

	  saveon = false
      swipeon = false
	  self.render()
	  console.log('view.Head:cancelItem:end')
	  return false
	},
	
	activateSave: function() {
	  console.log('view.Head:activateSave:begin')
	  var self = this
	  
      var textlen = self.elements.text.val().length
      textlen > 0 ? self.elements.save.css('opacity',1.0) : self.elements.save.css('opacity',0.1)
	  console.log('view.Head:activateSave:end')
	  return false
	},
	
	saveItem: function() {
	  console.log('view.Head:saveItem:begin')
	  var self = this
	  
	  var text = self.elements.text.val()
      if ( 0 == text.length ) {
       return
      }
	  saveon = false
	  // For now OwnerId is maintained in a global variable, should this be a tag in the head?
	  self.items.additem(self.elements.text.val(), ownerId)
	  
	  console.log('view.Head:saveItem:end')
	  return false
    },
	
	showTopLevel: function() {
	  console.log('view.Head:showTopLevel:begin')
	  var self = this
	  
	  toplevel = true
	  ownerId = 0
      // TODO: repopulate Items with ownerId=0
	  console.log('repopulating with items having ownerId = 0')
	  app.model.items.reload(ownerId)
	  app.view.head.render()
	  app.view.list.render()
	  
	  console.log('view.Head:showTopLevel:end')
	  return false
    }
  }))

  bb.view.Item = Backbone.View.extend(_.extend({
	events: {
	  'touchend .delete': 'deleteItem',
	  'click .delete': 'deleteItem',
	  'touchend .check' : 'tapItem',
	  'click .check' : 'tapItem',
	  'touchend .text' : 'tapItem',
	  'click .text' : 'tapItem',
	  'swipe .item' : 'swipeItem',
	  'touchend .details': 'showDetails',
	  'click .details': 'showDetails'
    },
	initialize: function(){
	  console.log('view.Item:initialize:begin')
	  var self = this
	  _.bindAll(self)
	  self.render()
	  console.log('view.Item:initialize:end')
	},
	
	render: function() {
	  console.log('view.Item:render:begin')
	  var self = this
	  
	  var html = self.tm.item( self.model.toJSON() )
	  self.$el.append(html)
	  app.markitem(self.$el, self.model.attributes.check)
	  // Need to manually set the theme of each <li> as it is added, based on user setting, since template uses default 'a'
	  var oldTheme = 'a'
	  var newTheme = app.model.settings.getTheme()
	  app.updateTheme(self.$el, oldTheme, newTheme)
	  self.$el.find('*').each(function() {
		app.updateTheme($(this), oldTheme, newTheme);
	  });
	  // Show details buton only if we are at toplevel
	  if (toplevel) {
	    self.$el.find('.details').show()
	  }
	  else {
	    self.$el.find('.details').hide()
	  }
  	  console.log('view.Item:render:end')
	},
	
	deleteItem: function() {
	  console.log('view.Item:deleteItem:begin')
	  var self = this
	  // need to associate with the correct element, use li id
	  // uses similar pattern as self.setElement("div[data-role='header']") for <div data-role="header" data-position="fixed">
	  console.log('deleting item with selector '+"li[id='" + self.model.attributes.id + "']")
	  self.setElement("li[id='" + self.model.attributes.id + "']")
	  swipeon = false
	  // TODO: When we switch to server do we need to do anything specific in relation to deletion of children?  Or will server handle it?
	  self.model.destroy()
	  self.remove()
	  console.log('view.Item:deleteItem:end')
	  return false
	},
	
	tapItem: function() {
	  console.log('view.Item:tapItem:begin')
	  var self = this
	  
	  if (!swipeon) {
	    console.log('toggling item with selector '+"li[id='" + self.model.attributes.id + "']")
	    self.setElement("li[id='" + self.model.attributes.id + "']")
	    // Toggle item checked value (and save)
	    self.model.toggleCheck()
	    app.markitem(self.$el, self.model.attributes.check)
	  }
	  console.log('view.Item:tapItem:end')
	  return false

	},
	
	swipeItem: function() {
	  console.log('view.Item:swipeItem:begin')
	  var self = this
	  
	  if (!swipeon) {
	    console.log('swiping on item with selector '+"li[id='" + self.model.attributes.id + "']")
	    swipeon = true
	    self.setElement("li[id='" + self.model.attributes.id + "']")
		self.$el.find('span.delete').show()
      }
	  else {
	    console.log('swiping off item with selector '+"li[id='" + self.model.attributes.id + "']")
	    swipeon = false
	  }
	  // render header to set buttons
	  app.view.head.render()
	  console.log('view.Item:swipeItem:end')
	  return false
	},
	
	showDetails: function() {
	  console.log('view.Item:showDetails:begin')
	  var self = this
	  
	  toplevel = false
      // TODO: repopulate Items with ownerId
	  console.log('repopulating with items having ownerId = '+self.model.attributes.id)
	  ownerId = self.model.attributes.id
	  app.model.items.reload(ownerId)
	  // TODO: This aint good since we are repopulating view.list because it has too many and 
	  // view.head multiple times
	  // need to refresh list since it is listening for additions, at this point View.List will contain 2* sets of items, parent and children
	  // View.Head has already been rerendered since it is listening for additions too, unless child list is
	  // empty which means we need to render
	  app.view.head.render()
	  app.view.list.render()

	  console.log('view.Item:showDetails:end')
	  return false
	}
	
  }, {
    tm: {
	  item: _.template($('#list').html() ) 
	}
  
  }))
    
  
  bb.view.List = Backbone.View.extend(_.extend({    

    initialize: function(items) {
	  console.log('view.List:initialize:begin')
      var self = this
      _.bindAll(self)

      self.setElement('#list')
	  self.items = items
	  self.items.on('add', self.appenditem)

	  console.log('view.List:initialize:end')
    },

    render: function() {
	  console.log('view.List:render:begin')
      var self = this

      self.$el.empty()
	  self.items.each( function(item) {
		self.appenditem(item)
      })
	  
	  console.log('view.List:render:end')
    },
	
	appenditem:function(item){
	  console.log('view.List:appenditem:begin')
      var self = this
  
      var itemview = new bb.view.Item({ model: item })
	  self.$el.append(itemview.el)
	  // TODO: Why does this scroll seem to block the Android keyboard?
	  //self.scroll()
	  console.log('view.List:appenditem:end')
	}
  }, 
  
  scrollContent))
  
  bb.view.Settings = Backbone.View.extend(_.extend({
	events: {
	  'tap #cancelsettings': 'cancelSettings',
	  'change #theme' : 'themeChanged'
    },
    initialize: function(settings) {
	  console.log('view.Settings:initialize:begin')
      var self = this
      _.bindAll(self)

	  self.settings = settings

	  self.setElement("div[id='settings']")
	  self.elements = {
	    title: self.$el.find('#settingstitle'),
		theme: self.$el.find('#theme')
	  }
	  
	  self.settings.on('change:userTheme', self.renderTheme)
	  
	  self.tm = {
        heading: _.template( self.elements.title.html() )
      }
	  
	  console.log('view.Settings:initialize:end')
    },
	
	render: function() {
	  console.log('view.Settings:render:begin')
	  var self = this
	  
	  self.elements.title.html( self.tm.heading( {title: 'Settings'} ))
	  self.elements.theme.val(self.settings.getTheme()).change()
	  self.renderTheme(self.settings)
	  console.log('view.Settings:render:end')
	},

	cancelSettings: function() {
	  console.log('view.Settings:cancelSettings:begin')
	  var self = this
	  
	  bb.router.navigate('', {trigger: true});
	  console.log('view.Settings:cancelSettings:end')
	  return false
    },

	themeChanged: function() {
	  console.log('view.Settings:themeChanged:begin')
	  var self = this
	  self.settings.setTheme(self.elements.theme.val())
	  console.log('view.Settings:themeChanged:end')
	  return false
    },

	renderTheme: function(settings) {
	  console.log('view.Settings:renderTheme:begin')
	  var self = this
	  // Update the data-theme of all elements with the new value, this was problematic
	  // First I tried straight jquery but although the attributes update correctly the theme wouldn't 'take'
	  // Then I tried setting the data-theme attributes via the usual bb elements but this had the same result as direct jquery assignment
	  // Finally I found a solution on github that seems to work: https://gist.github.com/1117707
	  self.setElement("div[id='settings']")
	  var oldTheme = self.$el.attr('data-theme') || 'a';
	  var newTheme = settings.get('userTheme')
	  app.updateTheme(self.el, oldTheme, newTheme);
	  self.$el.find('*').each(function() {
		app.updateTheme($(this), oldTheme, newTheme);
	  });
	  self.setElement("div[id='main']")
	  app.updateTheme(self.el, oldTheme, newTheme);
	  self.$el.find('*').each(function() {
		app.updateTheme($(this), oldTheme, newTheme);
	  });

	  console.log('view.Settings:renderTheme:end')
	  return false
    }
  }))

  bb.model.Item = Backbone.Model.extend(_.extend({
    defaults: {
	  id: '',
	  check: false,
	  text:'',
	  ownerId: 0
	},
	
	initialize: function(){
	  console.log('model.Item:initialize:begin')
	  var self = this
	  _.bindAll(self)
	  console.log('model.Item:initialize:end')
	},
	
	toggleCheck: function(){
	  console.log('model.Item:toggleCheck:begin')
	  var self = this
	  
	  // use backbone model get/set
	  self.set({check: !self.get('check')})
	  self.save()
	  console.log('model.Item:toggleCheck:end')
	}
  }))

  bb.model.Items = Backbone.Collection.extend(_.extend({
    model: bb.model.Item,
	localStorage: new Store("items"),

	initialize: function(){
	  console.log('model.Items:initialize:begin')
	  var self = this
	  _.bindAll(self)

	  console.log('model.Items:initialize:end')
	},

    additem: function(text, ownId){
	  console.log('model.Items:additem:begin')
      var self = this
	  
	  var id = new Date().getTime();
      var item = new bb.model.Item({id:id, text:text, ownerId: ownId})
      self.add(item)
	  item.save()
	  console.log('model.Items:additem:end')
    },
	
	reload: function(id){
	  var self = this
	  var itms = []
	  self.fetch()
	  for (i=0; i<self.length;i++){
	    itms[i] = self.at(i)
	  }
	  self.reset()
	  for (i=0; i<itms.length;i++){
	    if (itms[i].attributes.ownerId == id) {
		  self.add(itms[i])
		}
	  }
	}
  }))

  bb.model.State = Backbone.Model.extend(_.extend({
    defaults: { items_state:'loading'	}
  }))

  bb.model.Settings = Backbone.Model.extend(_.extend({
    defaults: {
	  userTheme: 'a'
	},
	
	initialize: function(){
	  console.log('model.Settings:initialize:begin')
	  var self = this
	  _.bindAll(self)
	  var savedTheme = localStorage.getItem('userTheme') || 'a'
	  self.setTheme(savedTheme)
	  console.log('model.Settings:initialize:end')
	},
	
	setTheme: function(newTheme){
	  console.log('model.Settings:setTheme:begin')
	  var self = this
	  self.set({userTheme: newTheme})
	  localStorage.setItem('userTheme',newTheme);
	  console.log('model.Settings:setTheme:end')
	},

	getTheme: function(){
	  console.log('model.Settings:getTheme:begin')
	  var self = this
	  
	  console.log('model.Settings:getTheme:end')
	  return (self.get('userTheme'))
	}
  }))

}

app.init_browser = function() {
	if (browser.android) {
		$("#main div[data-role='content']").css({bottom:0})
	}
}

app.markitem = function( item, done ) {
    item.find('span.check').html( done ? '&#10003;' : '&nbsp;' )
    item.find('span.text').css({'text-decoration': done ? 'line-through' : 'none' })
}

// This function obtained from https://gist.github.com/1117707 as I couldn't get theme switch to work any other way
app.updateTheme = function element_theme_refresh( element, oldTheme, newTheme ) {
  // Update the page's new data theme
  if( $(element).attr('data-theme') ) {
	$(element).attr('data-theme', newTheme);
  }
  if ( $(element).attr('class') ) {
	// Theme classes end in "-[a-z]$", so match that
	var classPattern = new RegExp('-' + oldTheme + '$');
	newTheme = '-' + newTheme;

	var classes =  $(element).attr('class').split(' ');

	for( var key in classes ) {
		if( classPattern.test( classes[key] ) ) {
			classes[key] = classes[key].replace( classPattern, newTheme );
		}
	}

	$(element).attr('class', classes.join(' '));
  }
}

app.init = function() {
  console.log('start init')

  bb.init()
  app.init_browser()
  
  app.model.items = new bb.model.Items()
  app.model.state = new bb.model.State()
  app.model.settings = new bb.model.Settings()
  
  app.view.head = new bb.view.Head(app.model.items)
  app.view.head.render()
  
  app.view.list = new bb.view.List(app.model.items)
  app.view.list.render()
  
  app.view.settings = new bb.view.Settings(app.model.settings)
  app.view.settings.render()

  /*
  app.model.items.fetch({
    success: function() {
	  setTimeout( 
	    function() {
	      app.model.state.set({items_state:'loaded'})
	    },
		500)
	}
  })
  */
  setTimeout( 
	    function() {
		  app.model.items.reload(0)
	      app.model.state.set({items_state:'loaded'})
	    },
		500)
  
  console.log('end init')
}

$(app.init)