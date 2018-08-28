var myApp = angular.module('myApp', ['ng-admin']);
var API_URL = 'http://localhost:3000/api/';

myApp.config(['NgAdminConfigurationProvider', function (NgAdminConfigurationProvider) {
    var nga = NgAdminConfigurationProvider;
    // create an admin application
    var admin = nga.application('Admin').baseApiUrl(API_URL);
    
    // entities
    var ServiceProvider = nga.entity('ServiceProviders');
    var User = nga.entity('CustomUsers');
    var Rubro = nga.entity('Rubros');
    var Empresa = nga.entity('Enterprises');

    // ServiceProvider
    ServiceProvider.listView()
    .filters([
        nga.field('nombre').label('Buscar')
            .attributes({ placeholder: 'Ingrese su búsqueda'})
            .pinned(true),
        nga.field('enterpriseId', 'reference').label('Empresa')
            .targetEntity(Empresa)
            .targetField(nga.field('nombre')),
        nga.field('rubroId', 'reference').label('Rubro')
            .targetEntity(Rubro)
            .targetField(nga.field('nombre'))
    ])
    .fields([
        nga.field('nombre').isDetailLink(true),
        nga.field('personaContacto'),
        nga.field('enterpriseId', 'reference')
            .targetEntity(Empresa)
            .targetField(nga.field('nombre')),
        nga.field('rubroId', 'reference')
            .targetEntity(Rubro)
            .targetField(nga.field('nombre')),
        nga.field('datosContacto'),
        nga.field('rating', 'template')
            .template('<rating></rating>'),
        nga.field('like', 'template').label('Evaluar')
            .template('<evaluate></evaluate>')
    ])
    .actions(['filter', 'create', 'export', 'delete'])

    ServiceProvider.creationView().fields([
        nga.field('nombre'),
        nga.field('personaContacto'),
        nga.field('enterpriseId', 'reference')
            .targetEntity(Empresa)
            .targetField(nga.field('nombre')),
        nga.field('rubroId', 'reference')
            .targetEntity(Rubro)
            .targetField(nga.field('nombre')),
        nga.field('datosContacto'),
        nga.field('rating', 'number')
    ])

    ServiceProvider.editionView().fields([
        nga.field('nombre'),
        nga.field('personaContacto'),
        nga.field('empresa'),
        nga.field('rubro'),
        nga.field('datosContacto'),
        nga.field('rating')
    ])

    // Users
    User.listView().fields([
        nga.field('username'),
        nga.field('email')
    ])

    User.creationView().fields([
        nga.field('username'),
        nga.field('email', 'password'),
        nga.field('password'),
        nga.field("rol", "choice")
            .choices([
                { value: 'Administrador', label: 'Admin' },
                { value: 'Evaluador', label: 'Evaluador' }
            ])
    ])

    // Empresa
    Empresa.listView().fields([
        nga.field('nombre')
    ])

    Empresa.creationView().fields([
        nga.field('nombre')
    ])

    // Rubro
    Rubro.listView().fields([
        nga.field('nombre')
    ])

    Rubro.creationView().fields([
        nga.field('nombre')
    ])

    // attached
    admin.addEntity(ServiceProvider);
    admin.addEntity(User);
    admin.addEntity(Rubro);
    admin.addEntity(Empresa);
    
    // attach the admin application to the DOM and run it
    nga.configure(admin);
}]);

myApp.config(['RestangularProvider', function (RestangularProvider) {
    console.log('asd');
    RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {

        if (operation == 'getList') {
  
          // Mapeando a API Loopback flavor
          params.filter = {};
  
          // where
          if(params._filters) {
  
            // Los modelos tienen que agregar los include en los permanentFilters
  
            // guardo los include
            var include = null;
            if(params._filters.include) {
              include = params._filters.include;
              delete params._filters.include;
            }
  
            // primero limpio los filtros
            var _filters = {};
            for (var filter in params._filters) {
              if(params._filters[filter]) {
                _filters[filter] = params._filters[filter];
              }
            }
  
            // ahora armo el string que voy a usar en el where REST
            var filterString = "";
  
            // si tengo más de un filtro agrego la adicion
            var paramsCount = Object.keys(_filters).length;
            if(paramsCount > 1) {
              filterString = '{"and":[';
            }
  
            // ahora si contruyendo el objeto where, primero en un String
            var index = 0;
            for (var filter in _filters) {
  
              // esta linea es la parte más harcodeada de todo el admin
              if(filter=='nombre' || filter=='title' || filter=='description' || filter=='address') {
                // para campos strings tengo que usar 'like'
                filterString += '{"' + filter + '": { "like":"' + _filters[filter] + '", "options": "i" } }';
              } else {
                if(_filters[filter] === Object(_filters[filter])) {
                  // el filtro puede ser un objeto, como en el caso de cuando chequeamos si un campo existe o no en un modelo
                  filterString += '{"' + filter + '":' + JSON.stringify(_filters[filter]) + '}';
                } else {
                  filterString += '{"' + filter + '":"' + _filters[filter] + '"}';
                }
              }
  
              if(index!=paramsCount-1) {
                filterString += ",";
              }
  
              index++;
            }
  
            if(paramsCount > 1) {
              filterString += ']}';
            }
  
            // terminando, si había filtros, convierto el String a JSON y lo agrego al params
            if(filterString.length) {
              params.filter['where'] = JSON.parse(filterString);
            }
  
            // Agrego los include
            if (include) {
              params.filter['include'] = include;
            }
  
            delete params._filters;
          }
  
          // Paginación
          if (params._page) {
            var limit = params._perPage;
            var offset = (params._page - 1) * params._perPage;
            params.filter['limit'] = limit.toString();
            params.filter['offset'] = offset.toString();
            delete params._page;
            delete params._perPage;
          }
  
          // Orden
          if (params._sortField) {
            params.filter['order'] = params._sortField + ' ' + (params._sortDir?params._sortDir:'');
            delete params._sortField;
            delete params._sortDir;
          }
  
          // if (headers['Content-Range']) {
          //     headers['X-Total-Count'] = headers['Content-Range'].split('/').pop();
          // }
        }
  
        return { params: params, headers: headers };
  
      });
    RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response) {
        if (operation == "getList") {
            var contentRange = response.headers('Content-Range');
            if(contentRange) {
              response.totalCount = contentRange.split('/')[1];
            } else {
              response.totalCount = 0;
            }
        }
        return data;
    });
}]);

myApp.directive('evaluate', function() {
    return {
        restrict: 'EA',
        templateUrl: 'evaluar.html',
        controller: function($rootScope, $scope, $http) {
            $scope.onMouseEnter = function($event, $index) {
                for (var i = 0; i < $index + 1; i++) {
                    console.log($('#' + $scope.setId(i)))
                    var el = $('#' + $scope.setId(i));
                    el.css('color', 'red')
                }
            }

            $scope.onMouseLeave = function($event) {
                var el = $('.iconito');
                el.css('color', 'black');
            }

            $scope.setId = function($index) {
                // console.log($index, $scope.entry.values['id'] + '-name')
                return $scope.entry.values['id'] +  '-'  + $index + '-name';
            }

            console.log($scope.name, 'name');

            $scope.evaluate = function($event, $index) {
                $http.get(API_URL + 'CustomUsers/' + JSON.parse(localStorage.getItem('$w-user')).id
                + '/ratings', {
                    params: {filter: {
                        where: {
                            serviceProviderId: $scope.entry.values['id']
                        }
                    }}
                }).then(function(data) {
                    console.log(data, data.data[0]);
                    if (data.data.length > 0) {
                        $http.put(API_URL + 'ratings', {
                            value: $index + 1,
                            id: data.data[0].id,
                            customUserId: data.data[0].customUserId,
                            serviceProviderId: data.data[0].serviceProviderId
                        })
                        .then(function(updated) {
                            console.log('Updated', updated);
                            $http.get(API_URL + 'ServiceProviders/' + $scope.entry.values['id'])
                                .then(function(provider) {
                                    console.log(provider.data);
                                    $scope.currentRating = provider.data.rating;
                                    $rootScope.$broadcast('rating:changed', {
                                        value: provider.data.rating, id: provider.data.id
                                    })
                                })
                        })
                    } else {
                        $http.post(API_URL + 'ratings/', {
                            value: $index + 1,
                            serviceProviderId: $scope.entry.values['id'],
                            customUserId: JSON.parse(localStorage.getItem('$w-user')).id
                        }).then(function(res) {
                        $http.get(API_URL + 'ServiceProviders/' + $scope.entry.values['id'])
                            .then(function(res) {
                                $scope.currentRating = res.data.rating;
                                $rootScope.$broadcast('rating:changed', {
                                    value: res.data.rating, id: res.data.id
                                })
                            })
                        }) 
                    }
                })
            };
            $scope.rating = new Array(5);
            $scope.currentRating = $scope.entry.values['rating'];
        }
    }
})

myApp.directive('rating', function() {
    return {
        restrict: 'EA',
        template: '{{rating}}',
        controller: function($rootScope, $scope, $http) {
            console.log($scope);
            $scope.rating = Math.round($scope.entry.values['rating'] * 100) / 100;
            // $rootScope.$on('rating:changed', function(value) {
            //     console.log('EMITED')
            //     $scope.rating = value;
            // })
            $scope.$on('rating:changed', function(evt, value) {
                    if ($scope.entry.values['id'] === value.id) {
                    $scope.rating = Math.round(value.value * 100) / 100;
                }
            })
        }
    }
})