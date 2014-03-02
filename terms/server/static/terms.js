
(function ($) {

    var Option = Control.sub({

        className: "wordOption",

        tag: "option"

    });

    var Word = Control.sub({

        className: "Word",

        tag: "span",

        _type: Control.property(),

        _subtype: Control.property(),

        toTerms: function () {
            return this.val();
        },

        inherited: {
            content: [
                {ref: "toshow", html: '<span class="word" />'},
                {ref: "toselect", html: "<select/>"},
            ]
        },

        showing: Control.chain( "$toshow", "content" ),
        append: Control.chain( "$toselect", "append" ),
        val: Control.chain( "$toselect", "val" ),
        selection: Control.chain( "$toselect", "content" ),

        type: function (name) {
            if (name === undefined) {
                return this._type();
            } else {
                var self = this;
                $.getJSON('/terms/' + name, function (names) {
                    self.loadOptions(names);
                });
                this._type(name);
            }
            return this;
        },

        subtype: function (name) {
            if (name === undefined) {
                return this._subtype();
            } else {
                var self = this;
                $.getJSON('/subterms/' + name, function (names) {
                    self.loadOptions(names);
                });
                this._type('verb');
                this._subtype(name);
            }
            return this;
        },

        loadOptions: function (names) {
            this.append(Option.create('---'));
            if (window.kb.building().startsWith('question')) {
                if (this.type() !== 'verb') {
                    this.append(Option.create('new variable'));
                    var vr = this.type().charAt(0).toUpperCase() + this.type().substr(1) + '1';
                    this.append(Option.create(vr));
                }
            }
            var opts = [];
            names.sort();
            for (var i=0, t=names.length; i<t; i++) {
                if (names[i].toLowerCase() === names[i] && names[i].substr(0, 4) !== 'abs-') {
                    this.append(Option.create(names[i]));
                }
            }
        },

        initialize: function () {
            var self = this;
            this.change(function (e) {
                if (self.val() === 'new variable') {
                    var newvar = prompt('enter new variable');
                    var opt = Option.create(newvar);
                    self.find('option:selected').after(opt);
                    self.val(newvar);
                }
                //self.find('option:selected').siblings().hide();
            });
            this.mouseleave(function (e) {
                if (self.val() !== '---') {
                    self.showing(self.val());
                    self.$toselect().hide();
                    self.$toshow().show();
                    //self.find('option:selected').siblings().hide();
                  }
            });
            this.mouseenter(function (e) {
                self.$toshow().hide();
                self.$toselect().show();
                //self.find('option:selected').siblings().show();
            });
            return this;
        }

    });

    var WNumber = Control.sub({

        className: "WNumber",

        tag: "input",

        initialize: function () {
            this.prop('type', 'text').prop('size', '5');
        },

        toTerms: function () {
            return this.val();
        }

    });

    var Fact = Control.sub({
    
        className: 'Fact',

        tag: "span",

        _factLevel: Control.property(),

        factLevel: function (level) {
            if (level === undefined) {
                return this._factLevel();
            } else {
                if (level === 0 &&
                    window.kb.building() === 'fact' &&
                    window.username !== 'admin') {
                    this.$verb().subtype('abs-person-action');
                } else {
                    this.$verb().type('verb');
                }
                this._factLevel(level);
                return this;
            }
        },

        inherited: {
            content: [
                {ref: "lparen", html: '<span class="paren lparen">(</span>'},
                {ref: "subject", html: "<span/>"},
                {ref: "verb", control: Word},
                {ref: "mods", html: "<span/>"},
                {ref: "rparen", html: '<span class="paren rparen">)</span>'},
            ]
        },

        _subject: Control.chain( "$subject", "content", "control", "toTerms" ),
        verb: Control.chain( "$verb", "toTerms" ),

        subject: function (value) {
            if (this.factLevel() > 0 ||
                window.username === 'admin' ||
                window.kb.building().startsWith('question')) {
                return this._subject(value);
            } else {
                return window.username;
            }
        },

        initialize: function () {
            var self = this;
            this.$verb().change(function (e) {
                self.handleVerbChange(e);
                e.stopPropagation();
            });
            return this;
        },

        toTerms: function () {
            var mods = this.$mods().content().control(),
                tmods = [],
                mod;
            if (mods === null || this.verb() === '---') { return '---' }
            for (var i=0, t=mods.length; i<t ; i++) {
                mod = $(mods[i]).control();
                if (mod.tvalue() === '---') { return '---' }
                tmods.push(mod.toTerms());
            }
            if (this.subject() === '---') { return '---' }
            return '(' + this.verb() + ' ' + this.subject() + ', ' + tmods.join(', ') + ')';
        },

        handleVerbChange: function (e) {
            var self = this;
            $.getJSON('/verb/' + this.verb(), function (data) {
                self.loadMods(data);
            });
            return this;
        },

        handleModChange: function (e) {
            if (this.factLevel() === 0) {
                var tfact = this.toTerms();
                if ( ! tfact.contains('---')) {
                    kb.$buttonsRemote().removeClass('hidden');
                } else {
                    kb.$buttonsRemote().class('hidden');
                }
                e.stopPropagation();
            }
        },

        loadMods: function (data) {
            var o, subj, mod, self = this;
            this.$mods().content('');
            for (var i=0, t=data.length; i<t ; i++) {
                o = data[i];
                if (o[0].charAt(o[0].length-1) === '_' && window.kb.building() !=='question-past') {
                    continue;
                } else if (o[0] === 'subj') {
                    if (this.factLevel() > 0 ||
                        window.username === 'admin' ||
                        window.kb.building().startsWith('question')) {
                        subj = Word.create().type(o[1]);
                        this.$subject().content(subj);
                        subj.change(function (e) {
                            self.handleModChange(e);
                        });
                    } else {
                        this.$subject().content(window.username);
                    }
                } else {
                    if (o[2]) {
                        mod = Mod.create()
                                 .label(o[0])
                                 .value(Fact.create()
                                            .factLevel(this.factLevel() + 1));
                        this.$mods().append(mod);
                    } else if (o[1] === 'number') {
                        mod = Mod.create()
                                 .label(o[0])
                                 .value(WNumber.create());
                        this.$mods().append(mod);
                    } else {
                        mod = Mod.create()
                                 .label(o[0])
                                 .value(Word.create()
                                            .type(o[1]));
                        this.$mods().append(mod);
                    }
                    mod.change( function (e) {
                        self.handleModChange(e);
                    });
                }
            }
        }

    });

    var Mod = Control.sub({
    
        className: 'Mod',

        tag: 'span',

        inherited: {
            content: [
                {ref: "label", html: "<span/>"},
                {ref: "value", html: "<span/>"}
            ]
        },

        label: Control.chain( "$label", "content" ),
        value: Control.chain( "$value", "content" ),
        tvalue: Control.chain( "$value", "content", "control", "toTerms" ),

        toTerms: function () {
            return this.label() + ' ' + this.tvalue();
        }

    });

    var NewName = Control.sub({

        className: 'Name',

        inherited: {
            content: [
                {ref: 'newname', html: '<input type="text"/>'},
                {ref: 'isa', html: '<span> is a </span>'},
                {ref: 'classname', control: Word, type: 'noun'}
            ]
        },

        newname: Control.chain('$newname', 'content'),
        classname: Control.chain('$classname', 'control', 'toTerms'),

        initialize: function () {
            var self = this;
            this.$newname().keypress(function (e) {
                self.handleChange(e);
            });
            this.$classname().change(function (e) {
                self.handleChange(e);
            });
        },

        toTerms: function () {
            return this.newname() + ' is a ' + this.classname();
        },

        handleChange: function (e) {
            if (this.newname() && (this.classname() !== '---')) {
                kb.$tellButton().removeClass('hidden');
                kb.$askButtons().class('hidden');
                kb.$buttonsRemote().removeClass('hidden');
            } else {
                kb.$buttonsRemote().class('hidden');
            }
        }

    });

    var Question = Control.sub({
        
        className: 'Question',

        inherited: {
            content: [
                {ref: 'facts', html: '<div id="tiles"/>'}
            ]
        },

        initialize: function () {
            this.$facts().html(Fact.create().factLevel(0).css('display', 'block'));
        },

        toTerms: function () {
            var trm = [];
            this.$facts().children().each(function (i, ch) {
                trm.push($(ch).control().toTerms());
            });
            return trm.join('; ');
        }
    });

    var KB = Control.sub({
        
        className: 'KB',

        ws: Control.property(),

        building: Control.property(),

        inherited: {
            content: [
                {ref: 'buttonsRemote', control: Control, content: [
                    {ref: 'askButtons', control: Control, class: 'hidden', content: [
                        {ref: 'askButton', html: '<button> ask </button>'},
                        {ref: 'newQFact', html: '<button> add fact </button>'}
                    ]},
                    {ref: 'tellButton', html: '<button> tell </button>', class: 'hidden'}
                ]},
                {ref: 'buttons', control: Control, content: [
                    {ref: 'nameButton', html: '<button> new name </button>'},
                    {ref: 'factButton', html: '<button> new fact </button>'},
                    {ref: 'pqButton', html: '<button> query the past </button>'},
                    {ref: 'qButton', html: '<button> query </button>'}
                ]},
                {ref: 'terms', html: '<div id="terms"/>'},
                {ref: 'tiles', html: '<div id="tiles" class="clearfix"/>'}
            ]
        },

        toTerms: Control.chain( "$terms", "content", 'control', 'toTerms' ),
        tcontrol: Control.chain( "$terms", "content", 'control' ),

        initialize: function () {
            var self = this;
            this.ws(new WebSocket("ws://localhost:8080/" + window.username + "/websocket"));
        
            this.ws().onmessage = function (e) {
                var data = JSON.parse(e.data);
                var content = data['html'];
                var tile = Tile.create()
                               .title(data['fact'] + '.')
                               .content(content);
                self.$tiles().append(tile);
                if (content === 'OK') {
                    tile.delay(5000).fadeOut();
                } else {
                    tile.click();
                }
                deform.processCallbacks();
            };

            this.$nameButton().click(function (e) {
                self.newName();
            });

            this.$factButton().click(function (e) {
                self.newFact();
            });

            this.$pqButton().click(function (e) {
                self.newQuestion(false);
            });

            this.$qButton().click(function (e) {
                self.newQuestion(true);
            });

            this.$askButton().click(function (e) {
                self.ask();
            });

            this.$tellButton().click(function (e) {
                self.tell();
            });

            this.$newQFact().click(function (e) {
                self.newQFact();
            });
        },

        newName: function () {
            this.$askButtons().class('hidden');
            this.$tellButton().removeClass('hidden');
            this.$buttonsRemote().class('hidden');
            this.building('name');
            this.$terms().html(NewName.create());
        },

        newFact: function () {
            this.$askButtons().class('hidden');
            this.$tellButton().removeClass('hidden');
            this.$buttonsRemote().class('hidden');
            this.building('fact');
            this.$terms().html(Fact.create().factLevel(0));
        },

        newQuestion: function (present) {
            this.$tellButton().class('hidden');
            this.$askButtons().removeClass('hidden');
            this.$buttonsRemote().class('hidden');
            if (present) {
                this.building('question');
            } else {
                this.building('question-past');
            }
            this.$terms().html(Question.create());
        },

        newQFact: function () {
            this.$buttonsRemote().class('hidden');
            this.tcontrol()
                .$facts()
                .append(Fact.create()
                            .factLevel(0)
                            .css('display', 'block'));
        },

        ask: function () {
            var self = this,
                toask = this.toTerms();
            $.get('/facts/' + toask, function (resp) {
                var tile = Tile.create()
                               .title(toask + '?')
                               .content(resp);
                self.$tiles().append(tile);
                $(tile.$display()).find('table.tablesorter').tablesorter();
            });
        },

        tell: function () {
            if (window.kb.building() === 'fact') {
                this.tellFact();
            } else if (window.kb.building() === 'name') {
                this.tellName();
            }
        },

        tellFact: function (trm) {
            if (trm === undefined) {
                trm = this.toTerms();
            }
            var tosend = JSON.stringify({fact: trm, data: []});
            this.ws().send(tosend);
        },

        tellName: function () {
            var self = this,
                name = this.tcontrol().newname(),
                classname = this.tcontrol().classname(),
                url = '/terms/' + name + '/' + classname;
            $.post(url, function (data) {
                self.nameTold(data);
                // initialize: username, ws. 
                var init = '(initialize ' + window.username + ', obj ' + name + ')';
                var tosend = JSON.stringify({fact: init, data: []});
                self.ws().send(tosend);
            });
        },

        handleAssertForm: function (form, e) {
            window.tinymce.triggerSave();
            e.preventDefault();
            var $form = $(form);
            var assertion = $form.find('button[name="assertion"]').val();
            var data = $form.serializeArray();
            var tosend = JSON.stringify({fact: assertion, data: data});
            this.ws().send(tosend);
            return false;
        },

        nameTold: function (data) {
            var tile = Tile.create()
                           .title(this.toTerms())
                           .content(JSON.stringify(data));
            this.$tiles().append(tile);
        }

    });

    var Tile = Control.sub({

        className: 'Tile five columns',

        inherited: {
            content: [
                {ref: 'anchor', control: Control, content: [
                    {ref: 'divcloser', control: Control, content: [
                        {ref: 'closer', html: '<span>X</span>'}
                    ]},
                    {ref: 'divtitle', control: Control, content: [
                        {ref: 'title', html: '<span/>'},
                    ]}
                ]},
                {ref: 'portlet', control: Control, class: 'hidden', content: [
                    {ref: 'portletBackground', html: '<div/>', class: 'portlet-background'},
                    {ref: 'displayCloser', html: '<span>X</span>', class: 'portlet-closer'},
                    {ref: 'display', html: '<div/>', class: 'portlet-display'}
                ]}
            ]
        },

        title: Control.chain( '$title', 'html' ),
        content: Control.chain( '$display', 'html' ),

/*        content: function (value) {
            var self = this;
            if (value === undefined) {
                return self.$display().html();
            } else {
                self.$display().html(value)
                if (value === 'OK') {
                    setTimeout(function () {
                        self.remove();
                    }, 5000)
                }
            }
        },
*/

        initialize: function () {
            var self = this;
            this.$closer().click(function (e) {
                e.stopPropagation();
                self.remove();
            });
            this.$displayCloser().click(function (e) {
                e.stopPropagation();
                self.$portlet().class('hidden');
            });
            this.click(function (e) {
                self.$portlet().removeClass('hidden');
            });
        }

    });

    $(document).ready( function () {

        var kb = KB.create();
        window.kb = kb;
        window.delay = 0;
        $('#kb').append(kb);

    });

})(jQuery);
