// Word
var Word = React.createClass({
  getInitialState: function () {
    return {
      choices: [],
      chosen: false,
      choice: null,
      number: false
    };
  },
  componentDidMount: function () {
    if (this.props.word === 'number') {
      this.setState({number: true});
      return;
    }
    var url = "/get-terms/" + this.props.word;
    $.ajax({
      url: url,
      dataType: 'json',
      cache: true,
      success: function (data) {
        console.log(data);
        this.setState({choices: data});
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(url, status, err.toString());
      }.bind(this)
    });
  },
  wordSelected: function (e) {
    this.setState({
      chosen: true,
      choice: e.target.value
    });
    if (this.props.onChange !== undefined) {
      this.props.onChange(e);
    }
  },
  render: function() {
    if (this.state.number) {
      return (
        <input type="text" />
      );
    }
    if (this.state.chosen) {
      return (
        <span className={this.props.className}>
        {this.state.choice}
        </span>
      );
    } else {
      var choices = this.state.choices.map(function (choice) {
        return (
          <option value={choice}>{choice}</option>
        );
      });
      return (
        <select className={this.props.className}
                onChange={this.wordSelected}>
          {choices}
        </select>
        );
    }
  }
});

// Label
var Label = React.createClass({
  render: function() {
    return (
      <span className="label">
      {this.props.label}
      </span>
    );
  }
});

// Mod
var Mod = React.createClass({
  render: function() {
    return (
      <span className="mod">
        <Label label={this.props.label} />
        <Word word={this.props.word} className="mod" />
      </span>
    );
  }
});

// Fact
var Fact = React.createClass({
  getInitialState: function () {
    return {
      verb: null,
      subject: null,
      mods: []
    };
  },
  handleSelectVerb: function (e) {
    var verb = e.target.value,
        url = '/get-verb/' + verb,
        subject = '',
        mods = [];
    $.ajax({
      url: url,
      dataType: 'json',
      cache: true,
      success: function (data) {
        console.log(data);
        data.map(function (mod) {
          if (mod[0] === 'subj') {
            subject = mod[1];
            console.log('subject is ' + subject);
          } else {
            mods.push(mod);
            console.log('one mod is ' + mod);
          }
        });
        this.setState({subject: subject,
                       mods: mods});
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(url, status, err.toString());
      }.bind(this)
    });
  },
  render: function () {
    var subject = '';
    if (this.state.subject !== null) {
      subject = (
          <Word word={this.state.subject}
                className="subject" />
      );
    }
    var mods = this.state.mods.map(function (mod) {
      return (
        <Mod label={mod[0]} word={mod[1]} />
      );
    });
    return (
      <div className="fact">
        {subject}
        <Word word="verb"
              className="verb"
              onChange={this.handleSelectVerb} />
        {mods}
      </div>
    );
  }
});
ReactDOM.render(
  <Fact />,
  document.getElementById('content')
);
