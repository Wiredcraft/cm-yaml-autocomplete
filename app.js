angular.module('YamlAutocomplete',[
	'ui.codemirror'
])

.controller('MainController', ['$scope', 'yaml_content', function($scope, yaml_content){

    var codemirrorLoaded = function(_editor){
        // autofocus: true options doesn't seem to take effect
        _editor.focus();
    };lib/codemirror.js

    $scope.content = yaml_content;

	$scope.editorOptions = {
        lineWrapping : true,
        lineNumbers : false,
        mode: 'yaml',
        onLoad: codemirrorLoaded,
        tabSize: 2,
        extraKeys: {
            'Ctrl-Space': 'autocomplete'
        }
    };
}])

.factory('yaml_content', [function(){
	/*
configuration: {}
name: 'web7'
provider:
  image: 'ubuntu12.04'
  name: 'digitalocean'
  region: '3'
  size: '66'
services:
  nginx: '*'
  php: '*'
*/

  return "configuration: {}\nname: 'web7'\nprovider:\n  image: 'ubuntu12.04'\n  name: 'digitalocean'\n  region: '3'\n  size: '66'\nservices:\n  nginx: '*'\n  php: '*'\n";
}]);