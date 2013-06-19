// Testacular configuration
// Minit version: 

// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
    JASMINE,
    JASMINE_ADAPTER,
    "node_modules/montage-testing/jasmine-additions.js",
    "node_modules/montage-testing/testacular-adapter.js",
    //
    // edit this section to include more files to be served
    //

    {pattern: 'assets/**/*', included: false},
    {pattern: 'ui/*', included: false},
    {pattern: 'ui/**/*', included: false},
    //{pattern: 'core/*', included: false},
    //{pattern: 'core/**/*', included: false},

    //
    // end
    //
    {pattern: 'package.json', included: false},
    {pattern: 'test/*', included: false},
    {pattern: 'test/**/*', included: false},
    {pattern: 'node_modules/montage-testing/*', included: false},
    {pattern: 'node_modules/montage/*.js', included: false},
    {pattern: 'node_modules/montage/**/*.js', included: false},
    {pattern: 'node_modules/montage/*.html', included: false},
    {pattern: 'node_modules/montage/**/*.html', included: false},
    {pattern: 'node_modules/montage/*.css', included: false},
    {pattern: 'node_modules/montage/**/*.css', included: false},
    {pattern: 'node_modules/montage/*.json', included: false},
    {pattern: 'node_modules/montage/**/*.json', included: false}
];


// list of files to exclude
exclude = [

];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress'];


// web server port
port = 8080;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 5000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
