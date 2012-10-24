/*
TODO:

- add caching
- test with devices!
- change text to a link if located and launch map
- create readme.txt

- verify if server init needs 2* calls to callback
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
  var loggedIn = false
  var listName = 'To Do: '
  
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
	  '': 'welcome',
	  'settings' : 'showSettings',
	  'main': 'showList'
	},
	showList : function() {
		console.log('myRouter:doMain')
		if (loggedIn) {
		  $('div#settings').hide();
		  $('div#welcome').hide();
		  $('div#main').show();
		}
		else {
		  bb.router.navigate('welcome', {trigger: true})
		}
	},
	showSettings : function() {
		console.log('myRouter:showSettings')
		if (loggedIn) {
		  $('div#main').hide();
		  $('div#welcome').hide();
		  $('div#settings').show();
		}
		else{
		  bb.router.navigate('welcome', {trigger: true})
		}
	},
	welcome : function() {
		console.log('myRouter:main')
		$('div#main').hide();
		$('div#settings').hide();
		$('div#welcome').show();
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
	  self.elements.back.hide()

	  // Need to rerender head when items are added or removed, also if reloaded 
	  self.items.on('add',self.render)
	  self.items.on('remove',self.render)
	  self.items.on('reset',self.render)
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
	  self.elements.title.html( self.tm.heading( {title: loaded ? listName+self.items.length+' Items' : listName+'Loading...'} ))
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
		$('.located').show()
		if (swipeon) {
	      $('.details').hide()
		}
		else {
	      $('.delete').hide()
		}
	  }
	  else {
	  	self.elements.settings.hide()
	    self.elements.add.hide()
	    self.elements.cancel.hide()
	    self.elements.back.hide()
	  }
	  console.log('view.Head:render:end')
	},

    showSettings: function() {
	  console.log('view.Head:showSettings:begin')
	  var self = this
      app.view.settings.render()
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
	  app.position.located = false
	  app.position.coords = {longitude:null, latitude:null}
	  // Grab position
	  navigator.geolocation.getCurrentPosition(
        function(position){
	      app.position = position
		  app.position.located = true
        },
        function(error){
	      console.log('view.Head:addItem:could not locate position')
        }
      )
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
	  self.items.additem(
	    self.elements.text.val(), 
		ownerId, 
		app.model.user.id, 
		app.position.located,
		app.position.coords.longitude,
		app.position.coords.latitude)
	  
	  console.log('view.Head:saveItem:end')
	  return false
    },
	
	showTopLevel: function() {
	  console.log('view.Head:showTopLevel:begin')
	  var self = this
	  
	  toplevel = true
	  ownerId = 0
	  console.log('repopulating with items having ownerId = 0')
	  // view.header and view.list rerender on model.items.reset
	  listName = 'To Do: '
	  app.model.state.set({items_state:'loading'})
	  app.model.items.fetch({
	    data : {userId: app.model.user.id},
        success: function() {
		  console.log('items loaded for mainlist')
		  app.model.state.set({items_state:'loaded'})
		}
      })

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
	  self.model.attributes.id = self.model.id
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
	  console.log('deleting item with selector '+"li[id='" + self.model.id + "']")
	  self.setElement("li[id='" + self.model.id + "']")
	  swipeon = false
	  // Server handles deletion of any subordinate items
	  self.model.destroy()
	  self.remove()
	  console.log('view.Item:deleteItem:end')
	  return false
	},
	
	tapItem: function() {
	  console.log('view.Item:tapItem:begin')
	  var self = this
	  
	  if (!swipeon) {
	    console.log('toggling item with selector '+"li[id='" + self.model.id + "']")
	    self.setElement("li[id='" + self.model.id + "']")
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
	    console.log('swiping on item with selector '+"li[id='" + self.model.id + "']")
	    swipeon = true
	    self.setElement("li[id='" + self.model.id + "']")
		self.$el.find('span.delete').show()
      }
	  else {
	    console.log('swiping off item with selector '+"li[id='" + self.model.id + "']")
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
	  console.log('repopulating with items having ownerId = '+self.model.id)
	  ownerId = self.model.id
	  // view.header and view.list rerender on model.items.reset
	  listName = self.model.attributes.text+': '
	  app.model.state.set({items_state:'loading'})
	  app.model.items.fetch({
	    data : {userId: app.model.user.id, ownerId:ownerId},
        success: function() {
		  console.log('items loaded for sublist')
		  app.model.state.set({items_state:'loaded'})
		}
      })

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
	  /* Items are either user added (triggering 'add' on model.items) so originally I just append view.list...
	     however there was a problem that items were added to view.list before being created on the server
	     so there was no item.id (needed for the <li> id attribute to allow for swipe and deletion etc)
		 => my original solution was to listen for 'sync' which fires after item has been saved which is the step
		 after it has been added to the collection so that the id would be present however...
		 there was a 404 being spuriously generated by the update to model.item.check which was preventing
		 sync also being raised on such an update... once the spurious 404 was fixed updating model.item.check
		 was also raising 'sync' and therefore calling appenditem (thus duplicating it in view.list)...
		 => solution was to raise a custom event on insert into model.item:
		 ** item.save([], {success:function(newitem){ console.log(newitem); self.trigger('additem',newitem)}}) **
		 and instead listen for this.  The new item added is then provided
	  */
	  //self.items.on('sync', self.appenditem)
	  self.items.on('additem', self.appenditem)
	  // ... or loaded from server (triggering 'reset' on model.items) so refresh list view
	  self.items.on('reset', self.render)
	  app.model.state.on('change',self.empty)
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
	},
	
	empty:function(){
	  console.log('view.List:empty:begin')
      var self = this
      if ('loading' === app.model.state.get('items_state')){
	    self.$el.empty()
	  }
	  console.log('view.List:empty:end')
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
	  self.render()
	  
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
	  
	  bb.router.navigate('main', {trigger: true});
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

  bb.view.Welcome = Backbone.View.extend(_.extend({
	events: {
	  'tap #login': 'login'
    },
    initialize: function(user, settings) {
	  console.log('view.Welcome:initialize:begin')
      var self = this
      _.bindAll(self)

	  self.setElement("div[id='welcome']")
	  self.elements = {
	    title: self.$el.find('#welcometitle'),
		user: self.$el.find('#user'),
		pw: self.$el.find('#pw'),
	  }
	  self.tm = {
        heading: _.template( self.elements.title.html() )
      }
	  self.user = user
	  self.settings = settings
	  console.log('view.Welcome:initialize:end')
    },
	
	render: function() {
	  console.log('view.Welcome:render:begin')
	  var self = this
	  self.elements.title.html( self.tm.heading( {title: 'Welcome'} ))
	  self.setElement("div[id='welcome']")
	  var oldTheme = self.$el.attr('data-theme') || 'a';
	  var newTheme = self.settings.get('userTheme')
	  app.updateTheme(self.el, oldTheme, newTheme);
	  self.$el.find('*').each(function() {
		app.updateTheme($(this), oldTheme, newTheme);
	  });

	  console.log('view.Welcome:render:end')
	},

	login: function() {
	  console.log('view.Welcome:login:begin')
	  var self = this
	  /* Using backbone fetch to validate user data here but would not use this in a real-life scenario
	     since this generates:
		 127.0.0.1 - - [Wed, 24 Oct 2012 09:23:26 GMT] "GET /api/user?user=ian&pw=secret
	  */
	  app.model.user.fetch({
	    data: {user:self.elements.user.val(), pw:self.elements.pw.val()},
        success: function() {
	      console.log('user verified')
		  loggedIn = true
		  app.model.items.fetch({
		    data: {userId: app.model.user.id},
            success: function() {
			  console.log('items loaded on login')
			  app.model.state.set({items_state:'loaded'})
			}
          })
		  app.view.head.render()
		  app.view.list.render()
          bb.router.navigate('main', {trigger: true})
	     },
		 error: function() {
		   self.elements.pw.val('')
		 }
	  })
	  console.log('view.Welcome:login:end')
	  return false
    }
  }))

  bb.model.Item = Backbone.Model.extend(_.extend({
    defaults: {
	  check: false,
	  text:'',
	  ownerId: 0,
	  userId: 0,
	  located: false,
	  latitude: null,
	  longitude: null
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
	url: '/api/todo',

	initialize: function(){
	  console.log('model.Items:initialize:begin')
	  var self = this
	  _.bindAll(self)
	  console.log('model.Items:initialize:end')
	},

    additem: function(text, ownerId, userId, located, longitude, latitude){
	  console.log('model.Items:additem:begin')
      var self = this
      var item = new bb.model.Item({
	    text:text, 
		ownerId: ownerId, 
		userId: userId, 
		located:located, 
		longitude:longitude,
		latitude:latitude})
      self.add(item)
	  // When item is added raise custom event so that view.list is appended - see view.List for details
	  item.save([], {success:function(newitem){ self.trigger('additem',newitem)}})
	  console.log('model.Items:additem:end')
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

  bb.model.User = Backbone.Model.extend(_.extend({
    url: '/api/user',
	defaults: {
	  user: '',
	  pw: ''
	},
	
	initialize: function(){
	  console.log('model.User:initialize:begin')
	  var self = this
	  _.bindAll(self)
	  console.log('model.User:initialize:end')
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
  app.position = {}
  
  app.model.items = new bb.model.Items()
  app.model.state = new bb.model.State()
  app.model.settings = new bb.model.Settings()
  app.model.user = new bb.model.User()
  
  app.view.welcome = new bb.view.Welcome(app.model.user, app.model.settings)
  app.view.welcome.render()

  app.view.head = new bb.view.Head(app.model.items)
  app.view.list = new bb.view.List(app.model.items)
  app.view.settings = new bb.view.Settings(app.model.settings)
  console.log('end init')
}

$(app.init)