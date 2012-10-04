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

  console.log('start init')
  var saveon = false
  var swipeon = false
  
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

  bb.view.Head = Backbone.View.extend(_.extend({
	events: {
	  'tap #add': 'addItem',
	  'tap #cancel': 'cancelItem',
	  'touchend #save': 'saveItem',
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
	    title: self.$el.find('h1'),
		add: self.$el.find('#add'),
		cancel: self.$el.find('#cancel')
      }
	  self.setElement("div[data-role='content']")
	  self.elements.newitem = self.$el.find('#newitem')
	  self.setElement('#newitem')
	  self.elements.text = self.$el.find('#text')
	  self.elements.save = self.$el.find('#save')

	  self.elements.add.hide()
	  self.elements.cancel.hide()

	  app.model.state.on('change:header_state',self.render)
	  self.items.on('add',self.render)
	  self.items.on('remove',self.render)	  

	  self.tm = {
        heading: _.template( self.elements.title.html() )
      }
	  console.log('view.Head:initialize:end')
    },
	
	render: function() {
	  console.log('view.Head:render:begin')
	  var self = this
	  
	  var loaded = 'loaded' == app.model.state.get('header_state')
	  self.elements.title.html( self.tm.heading( {title: loaded ? 'To Do List: '+self.items.length+' Items' : 'To Do List: Loading...'} ))
	  // Handle display of Header items (inc new item).  Header view renders when Items collection is changed.
	  if (loaded) {
	    if (!saveon && !swipeon) {
	      self.elements.add.show()
	      self.elements.cancel.hide()
		}
		else{
	      self.elements.add.hide()
	      self.elements.cancel.show()
		}
		if (saveon) {
          self.elements.newitem.slideDown()
		}
		else {
	      self.elements.text.val('').blur()
          self.elements.newitem.slideUp()
		}
		if (!swipeon) {
	      $('.delete').hide()
		}
	  }
	  console.log('view.Head:render:end')
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
	  self.items.additem(self.elements.text.val())
	  
	  console.log('view.Head:saveItem:end')
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
	  'swipe .item' : 'swipeItem'
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
  	  console.log('view.Item:render:end')
	},
	
	deleteItem: function() {
	  console.log('view.Item:deleteItem:begin')
	  var self = this
	  // need to associate with the correct element, use li id
	  // uses similar pattern as self.setElement("div[data-role='header']") for <div data-role="header" data-position="fixed">
	  console.log('deleting item with selector '+"li[id='" + self.model.attributes.id + "']")
	  self.setElement("li[id='" + self.model.attributes.id + "']")
	  // According to Backbonejs.org destroy() bubbles up through collections, view.Head now listening for 'remove' from model.Items
	  swipeon = false
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
	    self.elements = {
	      delbtn: self.$el.find('span.delete')
	    }
		self.elements.delbtn.show()
      }
	  else {
	    console.log('swiping off item with selector '+"li[id='" + self.model.attributes.id + "']")
	    swipeon = false
	  }
	  app.view.head.render()
	  console.log('view.Item:swipeItem:end')
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
	  self.count = 0
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
      //self.$el.append( itemview.$el.html() )      
	  self.$el.append(itemview.el)
	  // TODO: Why does this scroll seem to block the Android keyboard?
	  //self.scroll()
	  console.log('view.List:appenditem:end')
	}
  }, 
  
  scrollContent))
  
  bb.model.Item = Backbone.Model.extend(_.extend({
    defaults: {
	  id: '',
	  check: false,
	  text:'',
	  del:'Delete'
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

	  self.count = 0
	  // when collection is reset set the count correctly, I guess when it's refreshed from localstorage
	  self.on('reset', function() {self.count = self.length})
	  console.log('model.Items:initialize:end')
	},

    additem: function(text){
	  console.log('model.Items:additem:begin')
      var self = this
	  
	  var id = new Date().getTime();
      var item = new bb.model.Item({id:id, text:text})
      self.add(item)
      self.count++
	  item.save()
	  console.log('model.Items:additem:end')
    }	  
  }))

  bb.model.State = Backbone.Model.extend(_.extend({
    defaults: { header_state:'loading'	}
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

app.init = function() {
  console.log('start init')

  bb.init()
  app.init_browser()
  
  app.model.items = new bb.model.Items()
  app.model.state = new bb.model.State()
  
  app.view.head = new bb.view.Head(app.model.items)
  app.view.head.render()
  
  app.view.list = new bb.view.List(app.model.items)
  
  app.model.items.fetch({
    success: function() {
	  setTimeout( 
	    function() {
	      app.model.state.set({header_state:'loaded'})
	      app.view.list.render()
	    },
		500)
	}
  })

  console.log('end init')
}

$(app.init)