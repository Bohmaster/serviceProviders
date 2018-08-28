'use strict';

module.exports = function(Rating) {
    Rating.observe('after save', function(ctx, next) {
        if (ctx.isNewInstance) {
            console.log('New instance');
            var Provider = Rating.app.models.ServiceProvider;
            Provider.findById(ctx.instance.serviceProviderId, {
                include: 'ratingss'
                }, function(err, provider) {
                    console.log('ASDAD', provider.ratingss())
                    var promedio = provider.rating === null ? 
                        ctx.instance.value : ((provider.rating * (provider.ratingss().length - 1)) + ctx.instance.value) / 
                        (provider.ratingss().length);
                    provider.rating = promedio;
                    provider.save(function(err, newprovider) {
                        next();
                    })
                })
        } else {
            // var Provider = Rating.app.models.ServiceProvider;
            // Provider.findById(ctx.instance.serviceProviderId, {
            //     include: 'ratingss'
            //     }, function(err, provider) {


            //         // var promedio = provider.rating === null ? 
            //         //     ctx.instance.value : ((provider.rating * (provider.ratingss.length - 1)) + ctx.instance.value) / 
            //         //     (provider.ratingss.length);
            //         // provider.rating = promedio;
            //         // provider.save(function(err, newprovider) {
            //         //     next();
            //         // })
            //     })
            next();
        }
    })

    Rating.observe('before save', function(ctx, next) {
+        Rating.findById(ctx.instance.id, function(err, rating) {
            var newInstance = ctx.instance;
            var old = rating;

            if (err) {
                console.log('No se ha encontrado instancia', err);
                next();
            } else {
                console.log('Se ha encontrado una instancia');
                var Provider = Rating.app.models.ServiceProvider;
                Provider.findById(ctx.instance.serviceProviderId, {
                    include: 'ratingss'
                    }, function(err, provider) {
                        if (!err) {
                            console.log('Provider encontrado', provider.ratingss().length)
                            if (provider.ratingss.length > 1) {
                                var promedio = ((provider.rating * provider.ratingss().length) - rating.value) / (provider.ratingss.length - 1);
                                console.log('WWW', rating.value, ctx.instance.value, provider.rating, provider.ratingss().length);
                                var nuevoPromedio = ((promedio * provider.ratingss().length) + ctx.instance.value) / provider.ratingss().length;
                                provider.rating = nuevoPromedio;
                                provider.save(function(err, updated) {
                                    console.log('Provider actualizado', updated);
                                    next();
                                })
                            } else {
                                console.log('Error', err)
                                next();
                            }
                        } else {
                            next()
                        }
                    })
            }
            
        })
    })
};
