(function ($) {

    function Submitter (tosubmit, gen_mode) {
        this.elem = $('<button>' + gen_mode + '</button>');
        this.tosubmit = tosubmit;
        this.gen_mode = gen_mode;
    }

    Submitter.prototype.load_event = function () {
        var that = this;
        this.elem.click(function (e) {
            kb[that.gen_mode + '_' + that.tosubmit.gen_type](that.tosubmit);
        });
    };

    function Syntagm (type, parent, child_mode) {
        this.type = type;
        this.parent = parent;
        this.child_mode = child_mode;
        this.elem = $('<select class="' + child_mode + '"></select>');
        this.elem.append($('<option>---</option>'));
        var that = this;
        $.get('/terms/' + this.type, function (data) {
            that.set_values(eval(data));
        });
    }

    Syntagm.prototype.load_event = function () {
        var that = this;
        this.elem.change(function (e) {
            var vars = false;
            var val = that.elem.val();
            if (val[0] === val[0].toUpperCase()) {
                vars = true;
            }
            that.parent.notify(that.elem.val(), that.child_mode, vars);
            that.opts = that.elem.find('option:selected').siblings();
            that.opts.hide();
        });
        this.elem.mouseleave(function (e) {
            if (that.elem.val() !== '---') {
                that.opts = that.elem.find('option:selected').siblings();
                that.opts.hide();
            }
        });
        this.elem.mouseenter(function (e) {
            if (that.opts) {
                that.opts.show();
            }
        });
    };

    Syntagm.prototype.set_values = function (data) {
        for (var n in data) {
            e = $('<option>' + data[n] + '</option>');
            this.elem.append(e);
        }
        this.opts = this.elem.find('option:selected').siblings();
    };

    Syntagm.prototype.to_trm = function () {
        return this.elem.val();
    };

    function Modifier (label, val, parent) {
        this.label = label;
        this.parent = parent;
        this.elem = $('<span class="arg"></span>');
        var lspan = $('<span class="label">' + label + '</span>');
        this.elem.append(lspan);
        this.val = val;
        this.elem.append(this.val.elem);
    }

    function Definition (type) {
        this.gen_type = 'name';
        this.elem = $('<span></span>');
        this.val = $('<input type="text">');
        this.elem.append(this.val);
        var econj = $('<span>is a</span>');
        this.elem.append(econj);
        this.type = new Syntagm(type, this, 'def', 'tell');
        this.type.load_event();
        this.elem.append(this.type.elem);
        this.submitter = new Submitter(this, 'tell');
        this.submitter.load_event();
        this.submitter.elem.hide();
        this.elem.append(this.submitter.elem);
    }

    Definition.prototype.notify = function (val, child_mode, vars) {
        if (this.type.elem.val() == '---') {
            this.submitter.elem.hide();
        } else {
            this.submitter.elem.show();
        }
    };

    Definition.prototype.to_trm = function () {
        return this.val.val() + ':' + this.type.elem.val();
    };

    function Fact (parent) {
        this.gen_type = 'fact';
        this.parent = parent;
        this.elem = $('<span></span>');
        this.lparen();
        this.verb = new Syntagm('verb', this, 'verb');
        this.verb.load_event();
        this.elem.append(this.verb.elem);
        if (this.parent === null) {
            this.asker = new Submitter(this, 'ask');
            this.asker.load_event();
            this.asker.elem.hide();
            this.elem.append(this.asker.elem);
            this.teller = new Submitter(this, 'tell');
            this.teller.load_event();
            this.teller.elem.hide();
            this.elem.append(this.teller.elem);
        }
        this.rparen();
    }

    Fact.prototype.lparen = function () {
        var lparen = $('<span>(</span>');
        this.elem.html(lparen);
    };

    Fact.prototype.rparen = function () {
        var rparen = $('<span>)</span>');
        this.elem.append(rparen);
    };

    Fact.prototype.notify = function (val, child_mode, vars) {
        if (child_mode === 'verb'){
            this.update_verb(val);
        } else if ((child_mode === 'arg') || (child_mode === 'subject')) {
            var sval = this.subject.elem.val();
            var vval = this.verb.elem.val();
            if ((sval !== '---') && (vval !== '---')) {
                if ((sval[0] === sval[0].toUpperCase()) ||
                    (vval[0] === vval[0].toUpperCase())) {
                    vars = true;
                }
                for (var arg in this.args) {
                    var aval = this.args[arg].val.to_trm();
                    if ((aval === '---') || (!aval)) {
                        if (this.parent === null) {
                            this.asker.elem.hide();
                            this.teller.elem.hide();
                        }
                        return
                    } else if ((aval[0] !== '(') && (aval[0] === aval[0].toUpperCase())) {
                        if (this.parent === null) {
                            this.teller.elem.hide();
                        }
                        vars = true;
                    }
                }
                if (this.parent === null) {
                    this.asker.elem.show();
                    this.teller.elem.hide();
                    if (!vars) {
                        this.teller.elem.show();
                    }
                } else {
                    this.parent.notify(this, 'arg', vars);
                }
            }
        }
    };

    Fact.prototype.update_verb = function (verb) {
        var that = this;
        $.get('/verb/' + verb, function (data) {
            that.update_fact(eval(data));
        });
    };

    Fact.prototype.load_event = function () {
    };

    Fact.prototype.update_fact = function (objs) {
        this.args = new Array();
        for (var ob in objs) {
            var o = objs[ob];
            if (o[0].indexOf('_') == o[0].length - 1) {
                continue;
            } else if (o[0] == 'subj') {
                this.subject = new Syntagm(o[1], this, 'subject');
            } else if (o[2]) {
                var val = new Fact(this);
                var mod = new Modifier (o[0], val, this)
                this.args.push(mod);
            } else {
                var val = new Syntagm(o[1], this, 'arg');
                val.load_event();
                var mod = new Modifier (o[0], val, this)
                this.args.push(mod);
            }
        }
        this.lparen();
        this.subject.load_event();
        this.elem.append(this.subject.elem);
        this.verb.load_event();
        this.elem.append(this.verb.elem);
        for (var arg in this.args) {
            var mod = this.args[arg];
            mod.val.load_event();
            this.elem.append(mod.elem);
        }
        this.rparen();
        if (this.parent === null) {
            this.asker.load_event();
            this.asker.elem.hide();
            this.elem.append(this.asker.elem);
            this.teller.load_event();
            this.teller.elem.hide();
            this.elem.append(this.teller.elem);
        }
    };

    Fact.prototype.to_trm = function () {
        if (!this.subject) { return; }
        var trm = '(';
        trm += this.verb.elem.val() + ' ';
        trm += this.subject.elem.val();
        for (var a in this.args) {
            var arg = this.args[a];
            trm += ', ' + arg.label + ' ' + arg.val.to_trm();
        }
        trm += ')';
        return trm
    };

    function Portlet (title, elem) {
        this.title = title;
        this.elem = $(elem);
        this.title_elem = $('<div/>').addClass('portlet').html(title);
        elems.portlet_list.append(this.title_elem);
        var that = this;
        this.title_elem.click(function (e) {
            that.maximize();
        });
    }

    Portlet.prototype.maximize = function () {
        elems.overlay_content.html(this.elem);
        elems.overlay.show();
    };

    var kb = {
        tell_name: function (totell) {
            var trm = totell.to_trm();
            var names = trm.split(':');
            var url = '/terms/' + names[0] + '/' + names[1];
            $.post(url, function () {
                $.get('/schema/' + names[0], function (d) {
                    if (!d) {
                        var form = 'OK';
                    } else {
                        var form = $(d);
                    }
                    var portlet = new Portlet(trm, form);
                    if (form !== 'OK') {
                        form = portlet.elem;
                        var action = '/data/' + names[0];
                        form.submit(function (e) {
                            e.preventDefault();
                            var tosend = $(this).serialize();
                            $.post(action, tosend, function(data){
                                new Portlet(names[0], $('<span/>').html(data));
                            });
                            return false;
                        });
                    }
                });
            });
        },
        tell_fact: function (totell) {
            var trm = totell.to_trm();
            ws.send(trm);
        },
        ask_fact: function (toask) {
            var trm = toask.to_trm();
            $.get('/facts/' + trm, function (d) {
                new_answer(trm, eval(d));
            });
        }
    };

    function initialize () {
        elems.to_tell_name.click(function (e) {
            var def = new Definition('noun');
            elems.to_ask.html(def.elem);
        });
        elems.to_tell_fact.click(function () {
            var fact = new Fact(null);
            elems.to_ask.html(fact.elem);
        });
        $('span#minimize-overlay').click(function (e) {
            elems.overlay.hide();
        });
    }

    function new_answer (title, d) {
        if (typeof d === 'string') {
              new Portlet(title, d);
            } else {
              var tab = $('<table id="resp"></table>');
              var head = $('<tr></tr>');
              tab.append(head);
              for (var v in d[0]) {
                 head.append($('<th>' + v + '</th>'));
              }
              for (var r in d) {
                var res = d[r];
                var row = $('<tr></tr>');
                tab.append(row);
                for (var c in res) {
                  row.append('<td>' + res[c] + '</td>');
                }
              }
              new Portlet(title, tab);
          }
    }

    var elems = {
    };

    function process_data (obj) {
        if (obj['type'] == 'html') {
            return obj['data'];
        }
    }

    var ws = null;

    $(document).ready(function () {
        elems.to_tell_name = $('#to-tell-name');
        elems.to_tell_fact = $('#to-tell-fact');
        elems.to_ask = $('#to-ask');
        elems.portlet_list = $('div#portlet-list');
        elems.overlay = $('div#overlay');
        elems.overlay_content = $('div#overlay-content');
        initialize();
        ws = new WebSocket("ws://localhost:8080/websocket");
        ws.onmessage = function (evt) {
            var data = JSON.parse(evt.data);
            html = process_data(data);
            new Portlet(data['title'], html);
        };
    });

})(jQuery);
