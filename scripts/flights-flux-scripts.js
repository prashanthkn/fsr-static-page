/* static_content/default/default/scripts/exp/flights/searchResults/HandlebarsHelpers.js */
/*jslint browser: true */
/*global define */

define('templates', ['flights', 'handlebars', 'configuration', 'timestamp', 'operatedByStringBuilder', 'currency', 'underscore'], function(flights, handlebars, configuration, timestamp, operatedByStringBuilder, currency, _) {

    "use strict";

    var templates = {};

    templates.registerHelpers = function () {

        handlebars.registerHelper('compressWhitespace', function (options) {
            var html = options.fn(this);
            html = html.replace(/>\s+/g, ">");
            html = html.replace(/\s+</g, "<");
            return html;
        });

        handlebars.registerHelper('math', function(v1, operator, v2) {

            if(typeof v1 !== "undefined" && typeof v2 !== "undefined" && typeof operator !== "undefined")
            {
                switch (operator) {
                    case '+':
                        return (v1 + v2);
                    case '*':
                        return (v1 * v2);
                    case '/':
                        return (v1 / v2);
                    case '-':
                        return (v1 - v2);
                    case '%':
                        return (v1 % v2);
                    default:
                        return 0;
                }
            }

            return 0;
        });

        handlebars.registerHelper('lookupProp', function (obj, key, prop) {
            return obj[key] && obj[key][prop];
        });

        handlebars.registerHelper('if_contains', function(v1, v2, options) {
            if(v1 && v2 && (v1.indexOf(v2) > -1)) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        handlebars.registerHelper('if_and', function(v1, v2, options) {

            if(v1 && v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        handlebars.registerHelper('if_or', function(v1, v2, options) {
            if(v1 || v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

         // This helper allows you to perform OR on up to 4 expressions.
        handlebars.registerHelper('if_or4', function(v1, v2, v3, v4, options) {
            if(v1 || v2 || v3 || v4) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        handlebars.registerHelper('if_nor', function(v1, v2, options) {
            if(!(v1 || v2)) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        /**
         * If Equals
         * if_eq this that
         */
        handlebars.registerHelper('if_eq', function(v1, v2, options) {

            if((v1 === v2 && !options.hash.useDoubleEquals)
                || (v1 == v2 && true === options.hash.useDoubleEquals)) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        /**
         * If Equals
         * if_neq this that
         */
        handlebars.registerHelper('if_neq', function(v1, v2, options) {
            if(v1 !== v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        /**
         * If Equals
         * if_eq this that
         */
        handlebars.registerHelper('if_gt', function(v1, v2, options) {
            if(v1 > v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        handlebars.registerHelper('if_lt', function(v1, v2, options) {
            if(v1 < v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        handlebars.registerHelper('debug', function(optionalValue) {
            flights.log("====================");
            flights.log("Current Context");
            flights.log(this);

            if (optionalValue) {
                flights.log("Value");
                flights.log(optionalValue);
            }
            flights.log("====================");
        });

        handlebars.registerHelper('if_next_layover_exists', function(segments, currentIndex, options) {
            try{
                if((segments[currentIndex + 1] !== undefined && segments[currentIndex + 1].layover) ||
                        (segments[currentIndex + 1] !== undefined && segments[currentIndex + 2] !== undefined &&
                                segments[currentIndex + 2].layover)) {
                    return options.fn(this);
                }
            } catch(e) {
                flights.log("if_next_layover_exists: FAILED " + e);
            }
            return options.inverse(this);
        });

        handlebars.registerHelper('bargainFareText', function(data,option) {
            return flights.ModuleBuilder.Controller.bargainFareText(data,option);
        });

        handlebars.registerHelper('formatPrice', function(price, options) {

            currency.init(configuration.flightPriceDecimalSeparator);

            var template = handlebars.templates['formattedPrice'],
                parsedPrice = flights.Currency.parsePrice(price),
                addToPackagePrice = handlebars.helpers.loc('views_default_controls_flight_searchresults_flux_offerstrings.addToPackagePrice'),
                subtractFromPackagePrice = handlebars.helpers.loc('views_default_controls_flight_searchresults_flux_offerstrings.subtractFromPackagePrice'),
                earnGiftCardText = handlebars.helpers.stcs('com_expedia_www_domain_config_EarnRewardsGPSConfig_getEarnGiftCardText'),
                isMultiItemShoppingWithPackagePricing = configuration.isFlexibleShoppingEnabled && (flights.Model.Wizard.packageType != 'fc'),
                fuzzyFreshnessTime,
                dollarPrice = parsedPrice.wholePart,
                isPositiveDeltaPrice = options.hash.isPositiveDelta || false,
                currentTime,
                absoluteValuePrice = price.replace('-', ''),
                multiItemShoppingText = subtractFromPackagePrice.replace('{0}', absoluteValuePrice).trim(),
                points,
                isPointsAndOverage,
                isPointsPerPerson,
                pointsMarkup;

            if (earnGiftCardText) {
                earnGiftCardText = earnGiftCardText.replace('{{earnRewards}}', options.hash.earnGPSRewards)
            }

            if (undefined !== parsedPrice.prefix) {
                dollarPrice = parsedPrice.prefix + dollarPrice;
            }

            if (isPositiveDeltaPrice) {
                multiItemShoppingText = addToPackagePrice.replace('{0}', dollarPrice);
            }

            if( undefined !== options.hash.points ) {
                template = handlebars.templates['formattedPoints'];
                points = options.hash.points;
                isPointsAndOverage = options.hash.isPointsAndOverage;
                isPointsPerPerson = options.hash.isPointsPerPerson;
                pointsMarkup = '<span class=value>' + options.hash.points + '</span>';
            }

            if( undefined !== options.hash.deltaPrice ) {
                options.hash.useDeltaPrice = options.hash.deltaPrice >= 0;
                if(options.hash.deltaPrice < 0) {
                    parsedPrice.prefix = parsedPrice.prefix.replace('-', '- ');
                }
            }

            if(configuration.perceivedInstantEnabled) {
                currentTime = new Date().getTime().toString();
                fuzzyFreshnessTime = timestamp.generateViewedDateTimeMarkup( currentTime,
                    undefined !== options.hash.freshnessTime ? options.hash.freshnessTime.toString() : currentTime,
                    handlebars.templates.freshnessFuzzyDateTimeTemplate);
            }

            return template({
                isFlexibleShoppingEnabled: configuration.isFlexibleShoppingEnabled,
                displayTaxesAndFees: configuration.displayTaxesAndFees,
                earnGiftCardText: earnGiftCardText,
                isRoundTrip: configuration.route.isRoundTrip,
                isOneWay: configuration.route.isOneWay,
                parsedPrice: parsedPrice,
                showFromText: options.hash.showFromText || false,
                hidePrice: options.hash.hidePrice || false,
                fuzzyFreshnessTime: fuzzyFreshnessTime,
                isMultiItemShoppingWithPackagePricing: isMultiItemShoppingWithPackagePricing,
                dollarPriceText: options.hash.useDeltaPrice ? ('+ ' + dollarPrice) : dollarPrice,
                multiItemShoppingText: multiItemShoppingText,
                points: points,
                isPointsAndOverage: isPointsAndOverage,
                isPointsPerPerson: isPointsPerPerson,
                pointsMarkup: pointsMarkup,
                earnGPSRewards: options.hash.earnGPSRewards,
                earnRewardsLogoEnabled: configuration.earnRewardsLogoEnabled,
                showFreeCancellation: configuration.showFreeCancellationOnListings && options.data.root.showFreeCancelForOffer
            });
        });

        handlebars.registerHelper('getListingsOperatedByText', function(segments) {
            var template = handlebars.templates['fluxOperatedByTemplate'];
            return template({formattedOperatedByString: operatedByStringBuilder(segments)});
        });

        handlebars.registerHelper('if_operatedBy', function(segments, options) {
            var i,
                length = segments.length,
                segmentCarrier;

            for(i = 0; i < length; i+=2) {
                segmentCarrier = segments[i].carrier;
                if(segmentCarrier.operatedBy !== "") {
                    return options.fn(this);
                }
            }

            return options.inverse(this);
        });

        handlebars.registerHelper('getTabDetailsTitle', function(index){
          var buttonValues = [handlebars.helpers.loc('views_default_controls_flight_searchresults_flux_moduledetails.departure'),
                              handlebars.helpers.loc('views_default_controls_flight_searchresults_flux_moduledetails.return'),
                              handlebars.helpers.loc('views_default_controls_flight_searchresults_flux_moduledetails.tripTab')];

          if (typeof(index) !== 'number') {
            return '';
          }

          if (configuration.route.isMultiDest) {
            return buttonValues[2].replace(/{tripIndex}/i, index + 1);
          }

          return buttonValues[index];
        });

        handlebars.registerHelper('replaceOBFeeMessagesLink', function(obFeeType, message, altIconReference, href) {
            var obFeeMessage = handlebars.helpers.loc(message, {}, this),
                altIcon = handlebars.helpers.loc(altIconReference),
                icon = handlebars.helpers.uitk_icon({hash: {name:'popup', content:altIcon}});

            icon = icon.toString().replace(/\n/g, '');

            if (obFeeType === 'url') {
                obFeeMessage = obFeeMessage.replace('[a]', '<a href="' + href + '" target="_blank" rel="noopener noreferrer" data-click-handler="omnitureClickHandler" data-omniture-rfrr="OBFee.Details">');
                obFeeMessage = obFeeMessage.replace('[/a]', icon + '</a>');
            } else if(obFeeType === 'empty') {
                obFeeMessage = obFeeMessage.replace('[a]', '');
                obFeeMessage = obFeeMessage.replace('[/a]', '');
            } else {
                obFeeMessage = obFeeMessage.replace('[a]', '<a href="javascript:void(0)" feetype="' + obFeeType + '" data-click-handler="additionalFeeLink">');
                obFeeMessage = obFeeMessage.replace('[/a]', icon + '</a>');
            }

            return obFeeMessage;
        });

        handlebars.registerHelper('concat', function() {
            var i, result = '';

            for (i = 0; i < arguments.length; i++) {
                if ('object' === typeof arguments[i]) {
                    continue;
                }

                result += arguments[i];
            }

            return result;
        });

        handlebars.registerHelper('toString', function(value) {
            return value + '';
        });

        handlebars.registerHelper('not', function(value) {
            return !value;
        });

        handlebars.registerHelper('range', function(options) {
            var args = options.hash,
                start = args.start || 0,
                stop = args.stop || 0,
                step = args.step || 1;

            return _.range(start, stop, step);
        });

        handlebars.registerHelper('and', function() {
            var result = true,
                argsCount = arguments.length - 1;

            if (argsCount === 0) {
                return false;
            }

            for (var i = 0; i < argsCount ; i++) {
                if (!result) {
                    return false;
                }

                result = result && Boolean(arguments[i]);
            }

            return result;
        });

        handlebars.registerHelper('or', function() {
            var result = false,
                argsCount = arguments.length - 1;

            if (argsCount === 0) {
                return false;
            }

            for (var i = 0; i < argsCount ; i++) {
                if (result) {
                    return true;
                }

                result = result || Boolean(arguments[i]);
            }

            return result;
        });

        handlebars.registerHelper('equal', function(v1, v2, options) {
            return ((v1 === v2 && !options.hash.useDoubleEquals) || (v1 == v2 && true === options.hash.useDoubleEquals));
        });

        handlebars.registerHelper('greaterThan', function(v1, v2) {
            return parseInt(v1, 10) > parseInt(v2, 10);
        });

        handlebars.registerHelper('lessThan', function(v1, v2) {
                    return parseInt(v1, 10) < parseInt(v2, 10);
                });

        handlebars.registerHelper('replaceSubstringInLocString', function (options) {
            var locString = handlebars.helpers.loc(options.hash.locPath, {}, this),
                replacements = JSON.parse(options.hash.replacements);

            _.each(replacements, function (value, key) {
                locString = locString.replace(new RegExp(key, 'g'), value);
            });

            return locString;
        });

        handlebars.registerHelper('determineLeg', function (index, outboundValue, inboundValue) {
            var value;

            if (index === 0) {
                value = outboundValue;
            } else {
                value = inboundValue;
            }

            return value;
        });

        handlebars.registerHelper('includePartial', function (partialName, context) {
            return handlebars.templates[partialName](context);
        });

    };

    $(function () {
        templates.registerHelpers();
    });

    flights.Templates = templates;
    return templates;
});

require('templates', function(){});

/* static_content/default/default/scripts/exp/flights/searchResults/Currency.js */
/*jslint browser: true, regexp: true */
/*global define, expads */

define('currency', ['flights', 'jquery'], function (flights, $) {

    "use strict";

    var currency = {};

    function buildEmptyPrice() {
        return {
            prefix: "",
            wholePart: "",
            decimalPart: "",
            suffix: "",
            formattedWithDecimal: "",
            formattedWithoutDecimal: ""
        };
    }

    function splitOffLeadingCurrencySymbol(price) {
        var parts = price.match(flights.Model.Currency.leadingSymbolRegex);
        return parts ? parts.slice(1) : ["", ""];
    }

    function splitOffTrailingCurrencySymbol(price) {

        var i = price.length - 1,
            numberPart,
            symbolPart;

        while (i > 0 && !(price[i] >= '0' && price[i] <= '9')) {
            i -= 1;
        }

        numberPart = price.substring(0, i + 1);
        symbolPart = price.substring(i + 1);

        return [numberPart, symbolPart];

    }

    function parsePriceWithDecimal(price) {

        var parsedPrice = buildEmptyPrice(),
            parts;

        // Split possible currency symbol & rest of price into parts[]
        parts = splitOffLeadingCurrencySymbol(price);
        parsedPrice.prefix = parts[0];

        // Split again on separator, reusing parts[]
        parts = parts[1].split(flights.Model.Currency.decimalSeparator);
        parsedPrice.wholePart = parts[0];

        // Split decimal part and trailing symbol, again into parts[]
        if (parts.length > 1) {
            parts = splitOffTrailingCurrencySymbol(parts[1]);
            parsedPrice.decimalPart = flights.Model.Currency.decimalSeparator + parts[0];
            parsedPrice.suffix = parts[1];
        }
        parsedPrice.formattedWithDecimal = parsedPrice.prefix + parsedPrice.wholePart + parsedPrice.decimalPart + parsedPrice.suffix;
        parsedPrice.formattedWithoutDecimal = parsedPrice.prefix + parsedPrice.wholePart + parsedPrice.suffix;
        return parsedPrice;
    }

    function parsePriceWithNoDecimal(price) {
        var parsedPrice = buildEmptyPrice(),
            parts;

        // Split possible currency symbol & rest of price into parts[]
        parts = splitOffLeadingCurrencySymbol(price);
        parsedPrice.prefix = parts[0];

        // Split off price from possible trailing symbol, re-using parts[]
        parts = splitOffTrailingCurrencySymbol(parts[1]);
        parsedPrice.wholePart = parts[0];
        parsedPrice.suffix = parts[1];
        parsedPrice.formattedWithDecimal = parsedPrice.prefix + parsedPrice.wholePart + parsedPrice.decimalPart + parsedPrice.suffix;
        parsedPrice.formattedWithoutDecimal = parsedPrice.prefix + parsedPrice.wholePart + parsedPrice.suffix;
        return parsedPrice;
    }
	
    currency.parsePrice = function (formattedPrice) {

        var model = flights.Model.Currency;

        if (model.decimalSeparator.length > 0 &&
                formattedPrice.indexOf(model.decimalSeparator) >= 0) {

            return parsePriceWithDecimal(formattedPrice);
        }

        return parsePriceWithNoDecimal(formattedPrice);

    };
    //    ------------------   End of helper utilities for AB #5082 -------------------

    currency.init = function (decimalSeparator) {
        if (typeof decimalSeparator === "string") {
            flights.Model.Currency.decimalSeparator = decimalSeparator;
        }
    };

    $(function () {
        flights.Model = flights.Model || {};
        $.extend(flights.Model, {
            'Currency': {
                decimalSeparator: ".",
                leadingSymbolRegex: new RegExp(/^([^\d]*)([\d]+.*)$/)
            }
        });
    });

    flights.Currency = currency;

    return currency;

});

/* static_content/default/default/scripts/exp/flights/searchResults/GlobalWizard.js */
/*jslint browser: true */
/*global define */

define('globalWizard', ['flights', 'jquery', 'dctk/dctk', 'uitk'], function (flights, $, dctk, uitk) {
    "use strict";

    var wizard = {};

    wizard.ENDINGTABINDEX = parseInt($('#refundableFlights').attr('tabIndex'), 10) + 1;
    wizard.searchParameters = {};

    flights.Model = flights.Model || {};
    $.extend(flights.Model, {
        'Wizard': $.parseJSON($('#wizardData').html())
    });

    function initializeWizardSearchParameters(model) {
        wizard.searchParameters.departureAirport = model.departure.airport || ""; // This seems like a different format. "Seattle, WA, United States (SEA)" instead of "Seattle, WA, United States (SEA-Seattle - Tacoma Intl.)"
        wizard.searchParameters.arrivalAirport = model.arrival.airport || "";
        wizard.searchParameters.departureDate = model.departure.date || "";
        wizard.searchParameters.departDate = model.departure.date || "";
        wizard.searchParameters.arrivalDate = model.arrival.date || "";
        wizard.searchParameters.adultTraveler = "" + model.adultCount;
        wizard.searchParameters.childTraveler = "" + model.childCount;
        wizard.searchParameters.seniorTraveler = "";  // Seems deprecated
        wizard.searchParameters.preferredAirline = model.preferredAirline || "";
        wizard.searchParameters.flightClass = model.seatingClass || "";
        wizard.searchParameters.nonstopOnly = model.nonStop;
        wizard.searchParameters.refundableFlight = model.refundable;
        wizard.searchParameters.nearbyAirportInteraction = false;
        wizard.searchParameters.totalTravelers = model.totalPassengers;
    }

    initializeWizardSearchParameters(flights.Model.Wizard);

    flights.Wizard = wizard;

    return wizard;
});
/* static_content/default/default/scripts/exp/flights/searchResults/Analytics.js */
/*jslint browser: true, white: true, regexp: true, unparam: true, sub: true */
/*global define, console */

define('analytics', ['flights', 'jquery', 'dctk/dctk', 'uitk', 'configuration', 'underscore'],
    function (flights, $, dctk, uitk, configuration, _) {

    "use strict";

    var analytics = {},
        omnitureData;

    function getIDForToggle(isToggleOpen, $toggle) {
        var $target = $($toggle),
            omnitureRfrrAttr = $target.data('omnitureRfrr'),
            id;

        if (omnitureRfrrAttr === undefined) {
            /* this is here until CSE has a way for us to put tracking on inner elements of the wizard */
            if (!isToggleOpen && $target.find('.change').is(':visible')) { //change link visible, means cancel was clicked
                id = 'FLT.SR.Responsive.Wizard.Cancel';
            } else if (isToggleOpen && $target.find('.cancel').is(':visible')) { //cancel link visible, means change was clicked
                id = 'FLT.SR.Responsive.Wizard.ChangeSearch';
            }

            return id;
        }

        if (omnitureRfrrAttr.indexOf('INTERACT.OPTIONS') !== -1) {
            //Check whether to report to DCTK that the show more link was clicked
            if (isToggleOpen) {
                id = 'FLT.SR.INTERACT.SHOWOPTIONS';
            } else {
                id = 'FLT.SR.INTERACT.HIDEOPTIONS';
            }
        }

        if (omnitureRfrrAttr.indexOf('Filter.Airlines') !== -1) {
            console.log('BYOT Filter Toggle');
            if (isToggleOpen) {
                id = 'FLT.SR.' + omnitureRfrrAttr + '.ShowMore';
            } else {
                id = 'FLT.SR.' + omnitureRfrrAttr + '.ShowLess';
            }
        }
        //Filter.ArrTime.Leg0
        if(omnitureRfrrAttr.match(/^Filter.ArrTime.Leg\d$/g)) {
            if (isToggleOpen) {
                id = 'FLT.SR.' + omnitureRfrrAttr.replace('ArrTime', 'ArrTime.ShowMore');
            } else {
                id = 'FLT.SR.' + omnitureRfrrAttr.replace('ArrTime', 'ArrTime.ShowLess');
            }
        }
        return id;
    }

    function saveOmnitureData(newOmnitureData) {

        if ('object' !== typeof newOmnitureData) {
            flights.log('Invalid newOmnitureData parameter passed to Flights.Analytics saveOmnitureData().');
            return;
        }

        omnitureData = newOmnitureData;
    }

    function saveOmnitureProperty(property, value) {

        if ('string' !== typeof property || 'string' !== typeof value) {
            flights.log('Invalid parameter(s) passed to Flights.Analytics saveOmnitureProperty().');
            return;
        }

        omnitureData.omnitureProperties[property] = value;

    }

    function getPageName() {
        try {
            return dctk.omtr.pageName;
        } catch (error) {
            flights.log('PageName inaccessible in Flights.Analytics getPageName().');
            dctk.loggingAdapter.logError('Try Catch', error, ['origin=Flights.Analytics.getPageName']);
            return;
        }
    }

    analytics.trackPageLoad = function (leg) {

        leg = leg || 0; // Currently, leg is only passed for round trip on nextGen. For everything else, leg should be 0.

        if ('object' !== typeof dctk || 'object' !== typeof omnitureData) {
            flights.log('Cannot execute Flights.Analytics.trackPageLoad; problem with dctk or omnitureData.');
            return;
        }
        analytics.updateOmnitureProperty('pageName', configuration.pageName);
        dctk.initOmniture(omnitureData);
    };

    analytics.updateOmnitureProperty = function (property, value) {
        saveOmnitureProperty(property, value);
    };

    analytics.updateOmnitureData = function (newOmnitureData) {
        var dctkList1 = dctk.omtr.list1.split('|'),
            omnitureDataList1 = omnitureData.omnitureProperties.list1.split('|'),
            newOmnitureDataList1 = (newOmnitureData.omnitureProperties.list1 !== undefined) ? newOmnitureData.omnitureProperties.list1.split('|') : [];

        newOmnitureData.omnitureProperties.list1 = _.union(dctkList1, omnitureDataList1, newOmnitureDataList1).join('|');
        omnitureData = $.extend(true, omnitureData, newOmnitureData);

        return omnitureData;
    };

    analytics.initializeOmnitureData = function (leg) {

        var defaultOmnitureData = $.parseJSON($('#omnitureJSON').text());

        leg = leg || 0; // Currently, leg is only passed for round trip on nextGen. For everything else, leg should be 0.

        if ('number' !== typeof leg ||
                0 > leg ||
                'object' !== typeof defaultOmnitureData ||
                'number' !== typeof leg ||
                0 > leg) {
            flights.log('Invalid DOM data or leg parameter passed to Flights.Analytics.initializeLeg().');
            return;
        }

        saveOmnitureData(defaultOmnitureData);

        saveOmnitureProperty('pageName', configuration.pageName);

    };

    analytics.trackAction = function (id, $target, trackingParams, trackEvents) {

        var additionalTrackingParameters = {
                linkTrackVars : 'prop16,eVar28,events',
                prop16 : id
            },
            domElement = $target instanceof $ ? $target[0] : $target,
            pageName = {
                pageName: getPageName()
            };

        if (trackingParams !== undefined) {
            additionalTrackingParameters = $.extend(additionalTrackingParameters, trackingParams);
        }
        // update tracking parameters with current page name
        additionalTrackingParameters = $.extend(additionalTrackingParameters, pageName);

        if (typeof dctk === 'object' && typeof domElement === 'object') {
            dctk.trackAction(id,
                domElement,
                additionalTrackingParameters,
                trackEvents
            );
        }
    };

    analytics.trackActionWithIncrement = function (id, $target) {
        var domElement = $target instanceof $ ? $target[0] : $target;
        if (typeof dctk === 'object' && typeof domElement === 'object') {
            dctk.trackAction(id,
                domElement,
                {
                    linkTrackVars: 'prop16,eVar28,eVar57,events',
                    linkTrackEvents: 'event50',
                    prop16: id,
                    eVar57: '+1'
                },
                'event50');
        }
    };

    analytics.updatePageNameForOmniture = function (pageName) {
        var $pageId = $('#pageId');
        $pageId.val(pageName);
        dctk.logging.setPageName(pageName);
        configuration.pageName = pageName;
    };

    /**
     * Flights wrapper around UITK api to track impressions
     *
     * @see https://ewegithub.sb.karmalab.net/EWE/uitoolkit/blob/master/datacapture/src/main/resources/datacapture/js/lib.js
     */
    analytics.trackImpression  = function (id, trackVars, trackEvents) {

        if (id === undefined || 'string' !== typeof id) {

            flights.log("TrackImpression failed, mandatory parameter id is undefined");
            return;
        }

        if ('object' === typeof dctk) {
            dctk.trackImpression(id, trackVars, trackEvents);
        }
    };

    function init() {

        uitk.subscribe('toggle.opened', function (topic, $toggle, event) {
            var id = getIDForToggle(true, $toggle);
            if (id !== undefined) {
                analytics.trackAction(id, $toggle[0]);
                $toggle.uitk_toggle('open');
            }
        });

        uitk.subscribe('toggle.closed', function (topic, $toggle, event) {
            var id = getIDForToggle(false, $toggle);
            if (id !== undefined) {
                analytics.trackAction(id, $toggle[0]);
                $toggle.uitk_toggle('close');
            }
        });

        /* listen to responsive a-col expand/collapse */
        uitk.subscribe('off-canvas.stateChanged', function (topic, state) {
            /*
            passing in dummy element for now while the CSE team looks into passing
            in the element that triggered the event
            */
            if (state === 'open') {
                analytics.trackAction('FLT.SR.Filter.AcolButton.Open', $('<div/>'));
            } else if (state === 'closed') {

                /*
                This is a hack workaround for a bug in uitk that causes the a-col expand/collapse to get stuck closed.
                Should remove once bug is fixed: https://jira.sea.corp.expecn.com:8443/jira/browse/CSE-571
                */
                setTimeout(function () {
                    $('.off-canvas-open').removeClass('off-canvas-open');
                    $('.off-canvas-inner').removeClass('off-canvas-inner');
                }, 100);

                analytics.trackAction('FLT.SR.Filter.AcolButton.Close', $('<div/>'));
            } else {
                dctk.loggingAdapter.logMessage('Unexpected Value', [
                    'origin=Flights.Analytics.init.subscribe:off-canvas.stateChanged',
                    'message=Expected state to be either "open" or "closed".',
                    'state=' + state
                ]);
            }
        });
    }

    $(function () {
        init();
    });

    flights.Analytics = analytics;

    return analytics;

});

/* static_content/default/default/scripts/exp/flights/searchResults/Timestamp.js */
/*jslint browser: true, white: true, regexp: true */
/*global jQuery, Flights, TA, uitk, Handlebars, define */

/*
 * @author rbalakrishnan
 */
define('timestamp', ['flights', 'jquery', 'uitk', 'dctk/dctk', 'handlebars'], function(flights, $, uitk, dctk, handlebars) {

    "use strict";

    var timestamp = {};

    timestamp.ONE_MINUTE_IN_MS = 60000;
    timestamp.ONE_HOUR_IN_MS = 3600000;
    timestamp.ONE_DAY_IN_MS = 86400000;
    timestamp.ONE_WEEK_IN_MS = 604800000;

    function handleJustNowMessage(messageFlags) {
        messageFlags.viewedJustNow = true;
        messageFlags.omnitureRffr = "now";
    }

    function handleMinutesMessage(difference, messageFlags) {
        var viewedParameter = Math.floor(difference / timestamp.ONE_MINUTE_IN_MS);
        if (viewedParameter < 2) {
            messageFlags.viewedOneMinuteAgo = true;
        } else {
            messageFlags.viewedMinutesAgo = true;
        }

        if(viewedParameter >= 1 && viewedParameter <= 15) {
            messageFlags.omnitureRffr = "15m";
        } else if(viewedParameter > 15 && viewedParameter <= 30) {
            messageFlags.omnitureRffr = "30m";
        } else if(viewedParameter > 30 && viewedParameter <= 45) {
            messageFlags.omnitureRffr = "45m";
        } else if(viewedParameter > 45 && viewedParameter <= 60) {
            messageFlags.omnitureRffr = "1h";
        }
        return viewedParameter;
    }

    function handleHoursMessage(difference, messageFlags) {
        var viewedParameter = Math.floor(difference / timestamp.ONE_HOUR_IN_MS);
        if (viewedParameter < 2) {
            messageFlags.viewedOneHourAgo = true;
        } else {
            messageFlags.viewedHoursAgo = true;
        }
        messageFlags.omnitureRffr = viewedParameter + "h";
        return viewedParameter;
    }

    function handleDaysMessage(difference, messageFlags) {
        var viewedParameter =  Math.floor(difference / timestamp.ONE_DAY_IN_MS);
        if (viewedParameter < 2) {
            messageFlags.viewedYesterday = true;
        } else {
            messageFlags.viewedDaysAgo = true;
        }
        messageFlags.omnitureRffr = "yesterday";

        return viewedParameter;
    }

    function handleWeeksMessage(difference, messageFlags) {
        var viewedParameter =  Math.floor(difference / timestamp.ONE_WEEK_IN_MS);
        if (viewedParameter < 2) {
            messageFlags.viewedLastWeek = true;
        } else if (viewedParameter < 4) {
            messageFlags.viewedWeeksAgo = true;
        } else {
            messageFlags.viewedALongTimeAgo = true;
        }
        messageFlags.omnitureRffr = "yesterday";
        return viewedParameter;
    }

    function generatedViewedParameter(difference, messageFlags, viewedParameter) {
        if (difference < timestamp.ONE_MINUTE_IN_MS) {
            handleJustNowMessage(messageFlags);
        } else if (difference < timestamp.ONE_HOUR_IN_MS) {
            viewedParameter = handleMinutesMessage(difference, messageFlags);
        } else if (difference < timestamp.ONE_DAY_IN_MS) {
            viewedParameter = handleHoursMessage(difference, messageFlags);
        } else if (difference < timestamp.ONE_WEEK_IN_MS) {
            viewedParameter = handleDaysMessage(difference, messageFlags);
        } else {
            viewedParameter = handleWeeksMessage(difference, messageFlags);
        }
        return viewedParameter;
    }

    function initializeMessageFlags() {
        return {
            viewedJustNow: false,
            viewedOneMinuteAgo: false,
            viewedMinutesAgo: false,
            viewedOneHourAgo: false,
            viewedHoursAgo: false,
            viewedYesterday: false,
            viewedDaysAgo: false,
            viewedLastWeek: false,
            viewedWeeksAgo: false,
            viewedALongTimeAgo: false,
            viewError: false
        };
    }

    timestamp.generateViewedDateTimeMarkup = function(presentMomentTimeMS, searchTimeMS, fuzzyDateTimeTemplate) {
        var messageFlags = initializeMessageFlags(),
            viewedParameter = 0,
            difference,
            timeAtPresentMoment = new Date(parseFloat(presentMomentTimeMS.replace(/[^0-9]/g,""),10)),
            timeWhenSearchWasDone = new Date(parseFloat(searchTimeMS.replace(/[^0-9]/g,""),10));

        try {
            if (searchTimeMS === undefined) {
                return fuzzyDateTimeTemplate({
                    viewedParameter : 0, messageFlags: messageFlags
                });
            }

            difference = timeAtPresentMoment - timeWhenSearchWasDone;

            viewedParameter = generatedViewedParameter(difference, messageFlags, viewedParameter);

            return fuzzyDateTimeTemplate({
                viewedParameter : viewedParameter, messageFlags: messageFlags
            });
        }
        catch(error) {
            messageFlags.viewError = true;
            dctk.loggingAdapter.logError("timestamp.generateViewedDateTimeMarkup", error);
            return fuzzyDateTimeTemplate({
                viewedParameter : error.message, messageFlags : messageFlags
            });
        }
    };

    return timestamp;
});

/* static_content/default/default/scripts/exp/flights/searchResults/csfsrGetPriceAlerts.js */
define('priceAlert', ['jquery', 'flights', 'fluxClickHandler', 'i18n', 'uitk', 'configuration', 'analytics', 'dctk/dctk', 'experiments', 'uiModel'], function ($, flights, fluxClickHandler, i18n, uitk, configuration, analytics, dctk, experiments, uiModel) {
    'use strict';

    function validateField($elem) {
        var $label = $elem.parent('label'),
            $error = $('#' + $elem.attr('aria-describedby')),
            emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/,
            errorMsg;

        if (!emailReg.test($elem.val())) {
            $label.addClass('invalid');
            $elem.attr('aria-invalid', 'true');
            errorMsg = $elem.data('validationMsg');
            $error.html(errorMsg).removeClass('visuallyhidden');
            return false;
        }

        $label.removeClass('invalid');
        $elem.attr('aria-invalid', 'false');
        $error.html('').addClass('visuallyhidden');
        return true;
    }

    function showServerErrorMessage(serverError) {
        resetTimeoutForLoader();
        uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertError);
        $('#priceChangeAlertBtn').addClass('hidden');
        showErrorContainerAndHideOthers(serverError);
    }

    function validateEmailInputField() {
        return validateField($('#emailInputField'));
    }

    function validateEmailInputFieldOnBlur() {
        if (!priceAlert.validSubmit) {
            validateEmailInputField();
        }
    }

    function setEmailFieldToDefault() {
        $('#emailInputField').attr('value', '');
        $('#emailInputField').attr('disabled', true);
    }

    function changeButtonToLoader() {
        priceAlert.timeoutForLoader = null;
        $('#priceChangeAlertPopUpButtonContainer').addClass('hidden');
        $('#priceChangeAlertPopUpLoaderContainer').removeClass('hidden');
    }

    function setTimeoutToChangeButtonToLoader() {
        priceAlert.timeoutForLoader = setTimeout(changeButtonToLoader, configuration.priceAlerts.loaderTimeout);
    }

    function resetTimeoutForLoader() {
        if (priceAlert.timeoutForLoader) {
            clearTimeout(priceAlert.timeoutForLoader);
        }
    }

    function setUpOmnitureDataForSoftAccountCreation(data) {
        if (data.newSoftAccountCreated !== undefined && data.newSoftAccountCreated === true) {
            if (typeof dctk !== 'undefined') {
                dctk.onReady(function () {
                    dctk.trackEvent('o', 'priceChangeAlertPopUp', {eVar28: 'SOFT.ACCOUNT.CREATED', prop16: 'SOFT.ACCOUNT.CREATED'});
                });
            }
        }
    }

    function showErrorContainerAndHideOthers(data) {
        $('#priceChangeAlertPopUpButtonContainer').addClass('hidden');
        $('#priceChangeAlertPopUpLoaderContainer').addClass('hidden');
        $('#priceChangeAlertPopUpErrorContainer').removeClass('hidden');
        if (data !== undefined ) {
            $('#popupCreatingYourPriceAlertErrorText').text(data);
        }
    }

    function onModalClose(topic, modal) {
        var email;

        if (modal.options.modalId === 'priceChangeAlertPopupModal') {
            if (this.validSubmit) {
                uitk.utils.focusElement($('#priceChangeAlert'));
            } else {
                email = $('#emailInputField').val();

                if (email) {
                    analytics.trackAction('FLT.SR.GetPriceAlerts.Close.Aborted', modal);
                } else {
                    analytics.trackAction('FLT.SR.GetPriceAlerts.Close.Ignored', modal);
                }

                uitk.utils.focusElement($('#priceChangeAlertBtn'));
            }
        }
    }

    function onModalOpen(topic, modal) {
        if (modal.options.modalId === 'priceChangeAlertPopupModal') {
            clearValidation();
            $('#priceChangeAlertPopUpButton').removeAttr('disabled');
            $('#emailInputField').blur(validateEmailInputFieldOnBlur);
        }
    }

    function getUrlParameter(paramName) {
        var searchString = $(window)[0].location.search.substring(1),
            i,
            val,
            params = searchString.split('&');

        for (i = 0; i < params.length; i++) {
            val = params[i].split('=');
            if (val[0] === paramName) {
                return val[1];
            }
        }
        return '';
    }

    function clearValidation() {
        $('#emailValidationError').addClass('visuallyhidden');
        $('#priceChangeAlertForm label').removeClass('invalid');
    }

    function diagnosticReport(tag, email) {
        var tuid = $('#scratchpad-badge-tuid').attr('data-id'),
            guid = $('#scratchpad-badge-guid').attr('data-id'),
            userType = $.parseJSON($('#omnitureJSON').text()).omnitureProperties.userType,
            userState = 'unidentified',
            reportData = [];

        reportData.push('tuid=' + tuid);
        reportData.push('guid=' + guid);

        if (userType === 'AUTHENTICATED') {
            userState = 'authenticated';
        } else if (userType === 'IDENTIFIED') {
            userState = 'identified';
        }
        reportData.push('user-state=' + userState);

        if (email !== undefined) {
            reportData.push('email-address=' + email);
        }

        if (dctk && dctk.logging && dctk.logging.logMessage) {
            dctk.logging.logMessage('ShopperProgram_' + tag, reportData);
        }

        flights.log('Price Alert Diagnostic Report:');
        flights.log(reportData);
    }

    var priceAlert = {
        validSubmit: false,
        timeoutForLoader: null,
        isSubscribedToPriceAlerts: configuration.priceAlerts.variant === 2,

        initialize: function (options) {
            this.bindEvents();

            this.departureAirport = options.departureAirport;
            this.arrivalAirport = options.arrivalAirport
            this.departureDate = options.departureDate;
            this.arrivalDate = options.arrivalDate;
            this.dateFormat = options.dateFormat;

            this.showPriceAlertsModule();
        },

        showPriceAlertsModule: function () {
            this.priceChangeAlertReset();

            if (configuration.priceAlerts.variant > 0 && configuration.priceAlerts.priceAlertAlternateBehavior ) {
                flights.vent.on( 'uiModel.resetViewableOffers', function (options) {
                    if (priceAlert.priceAlertAlternateConditions()) {
                        priceAlert.showPriceAlertButton();
                    }
                });
            } else if (configuration.priceAlerts.variant > 0) {
                priceAlert.showPriceAlertButton();
            }
        },

        priceAlertAlternateConditions: function() {
            if (
                _.isEmpty(flights.collections.legsCollection.first().attributes) ||
                !configuration.route.isRoundTrip
            ) {
                return false;
            } else {
                return true;
            }
        },

        hidePriceAlertsModule: function () {
            if (configuration.priceAlerts.variant > 0) {
                $('#priceChangeAlert').addClass('hidden');
            }
        },

        bindEvents: function () {
            flights.vent.on('router.selectedLegs', this.hidePriceAlertsModule, this);
            flights.vent.on('router.noSelectedLegs', this.showPriceAlertsModule, this);
        },

        signUpForPriceAlerts: function (event, target, self) {
            diagnosticReport('GetPriceAlert');

            if (configuration.priceAlerts.variant === 1 && !configuration.priceAlerts.priceAlertAlternateBehavior) {
                self.subscribeViaScratchpad({
                    success: function () {
                        self.showAddedToPriceAlertsNotification();
                        uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertAlreadySubscribed);
                    },
                    error: showServerErrorMessage
                });
            } else {
                uitk.modal.close();
                $('.get-price-alert-popup-link').click();
            }
        },

        subscribeViaScratchpad: function (options) {
            var self = this;

            $(window)[0].Scratchpad.sendNotes(true)
                .success(function () {
                    self.isSubscribedToPriceAlerts = true;
                    uitk.publish('FSR.PriceAlerts.subscribed');
                    if (options && typeof options.success === 'function') {
                        options.success();
                    }
                })
                .error(function (textStatus, errorThrown) {
                    console.log('error:', textStatus);
                    console.log(errorThrown);

                    if (options && typeof options.error === 'function') {
                        options.error();
                    }
                });
        },

        createAlert: function (target, event, self) {
            var emailAddress = $('#emailInputField').val();

            if (validateEmailInputField()) {
                if (configuration.priceAlerts.priceAlertAlternateBehavior) {
                    priceAlert.createPriceAlertAlternateMode(emailAddress, {
                        departureAirport: priceAlert.departureAirport,
                        departureDate: priceAlert.departureDate,
                        arrivalAirport: priceAlert.arrivalAirport,
                        arrivalDate: priceAlert.arrivalDate,
                        dateFormat: priceAlert.dateFormat,
                        success: function(data){
                            resetTimeoutForLoader();
                            uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertAlreadySubscribed);
                            self.showAddedToPriceAlertsNotification();
                            uitk.modal.close();
                        },
                        error: function(data) {
                            if (data && data.errors && data.errors.error && data.errors.error[0] && data.errors.error[0].errorMessage ) {
                                showServerErrorMessage(data.errors.error[0].errorMessage);
                            } else {
                                showServerErrorMessage();
                            }
                        }

                });
                } else {
                    $('#priceChangeAlertPopUpButton').attr('disabled', 'disabled');
                    analytics.trackAction('FLT.SR.GetPriceAlerts.CreateAlert', $('#priceChangeAlertPopUpButton'));
                    self.createPriceAlerts(emailAddress, {
                        channelType: 'FSRPriceAlertsACol',
                        redirectUrlReferrer: 'EML.FLT.SR.GetPriceAlerts.CreateAlert',
                        success: function (data) {
                            resetTimeoutForLoader();
                            setUpOmnitureDataForSoftAccountCreation(data);
                            if (data.validationStatus === 'NOT_VALIDATED' || data.validationStatus === 'PENDING_VALIDATION') {
                                uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertCheckYourEmail);
                                self.showCheckYourEmailNotification();
                                uitk.modal.close();
                                experiments.execute('PRICEALERTS.CHECKEMAILCONFIRM.MODAL', {});
                            } else if (data.validationStatus === 'VALIDATED') {
                                uitk.modal.close();
                                uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertAlreadySubscribed);
                                self.showAddedToPriceAlertsNotification();
                            } else {
                                showServerErrorMessage();
                            }
                        },
                        error: showServerErrorMessage

                    });}
            } else {
                $('#emailInputField').select();
                uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertInvalidEmail);
            }

            if (event && event.preventDefault) {
                event.preventDefault();
            }
        },

        createPriceAlerts: function (emailAddress, options) {
            var self = this,
                redirectUrlTemplate = 'Flights-Search?trip={trip}&leg1={leg1}&leg2={leg2}&passengers={passengers}&mode={mode}&rfrr={rfrr}',
                requestData = {
                    email: emailAddress,
                    type: options.channelType
                },
                redirectUrl,
                redirectUrlReferrer = options.redirectUrlReferrer;

            redirectUrl = redirectUrlTemplate
                .replace('{trip}', getUrlParameter('trip'))
                .replace('{leg1}', decodeURIComponent(getUrlParameter('leg1')))
                .replace('{leg2}', decodeURIComponent(getUrlParameter('leg2')))
                .replace('{passengers}', getUrlParameter('passengers'))
                .replace('{mode}', getUrlParameter('mode'))
                .replace('{rfrr}', redirectUrlReferrer);

            requestData.redirectUri = encodeURI(redirectUrl);

            uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertCreatingYourPriceAlert);
            this.validSubmit = true;
            setTimeoutToChangeButtonToLoader();
            setEmailFieldToDefault();
            diagnosticReport('CreateAlert', emailAddress);

            $.ajax({
                url: '/price-alerts-subscribe',
                type: 'POST',
                dataType: 'json',
                data: requestData,
                timeout: configuration.priceAlerts.subscribeAjaxTimeout,
                success: function (data) {
                    self.isSubscribedToPriceAlerts = true;
                    uitk.publish('FSR.PriceAlerts.created');
                    if (options && typeof options.success === 'function') {
                        options.success(data);
                    }
                },
                error: function () {
                    if (options && typeof options.error === 'function') {
                        options.error();
                    }
                }
            });
        },

        createPriceAlertAlternateMode: function(emailAddress, options) {
            setTimeoutToChangeButtonToLoader();
            uitk.utils.liveAnnounce(i18n.priceChangedModal.priceChangeAlertCreatingYourPriceAlert);
            var departureDate = priceAlert.getIsoDateString(flights.getDateObj(options.departureDate, options.dateFormat));
            var arrivalDate = priceAlert.getIsoDateString(flights.getDateObj(options.arrivalDate, options.dateFormat));
            var lowestPrice = _.min(flights.collections.legsCollection.first().attributes, function(leg) {return leg.price.exactPrice}).price.exactPrice;
            var postData = JSON.stringify({
                "email": emailAddress,
                "origin": options.departureAirport,
                "departureDate": departureDate,
                "destination": options.arrivalAirport,
                "returnDate": arrivalDate,
                "lowestPrice": lowestPrice,
                "flightType": "RoundTrip"
            });
            $.ajax({
                url: configuration.priceAlerts.altPriceAlertEndpoint,
                type: 'POST',
                dataType: "json",
                contentType: "application/json",
                data: postData,
                timeout: configuration.millisBeforeShowGetPriceAlertTimeout,
                success: function (data) {
                    if (options && typeof options.success === 'function') {
                        options.success(data);
                    }
                },
                error: function (data) {
                    if (options && typeof options.error === 'function') {
                        var responseJson;
                        try {
                            responseJson = JSON.parse(data.responseText);

                        } catch(data) { /*swallow anything not JSON */ }
                        options.error(responseJson);
                    }
                }
            })
        },

        getIsoDateString: function(date) {
            var dateString = "";
            var year = date.getFullYear();
            var month = Number(date.getMonth()) + 1;
            var date = date.getDate();
            if (month < 10) {
                month = "0" + month;
            }
            if (date < 10) {
                date = "0" + date;
            }
            dateString = year + '-' + month + '-' + date;
            return dateString;
        },

        showPriceAlertButton: function () {
            var priceAlertBtn = $('#priceChangeAlertBtn');

            uitk.subscribe('modal.appended', onModalOpen);
            uitk.subscribe('modal.close', this, onModalClose);

            $('#priceChangeAlert').removeClass('hidden');

            if (configuration.priceAlerts.variant === 2) {
                priceAlertBtn.addClass('hidden');
                $('#priceChangeAlertAlreadySubscribed').removeClass('hidden');
            }
        },

        priceChangeAlertReset: function () {
            if (window.innerWidth < 960) {
                $('#bCol').prepend($('#priceChangeAlert').remove());
            }
            $(window).resize(function () {
                if (window.innerWidth < 960) {
                    $('#bCol').prepend($('#priceChangeAlert').remove());
                } else {
                    $('#aCol').prepend($('#priceChangeAlert').remove());
                }
            });
        },

        showCheckYourEmailNotification: function () {
            $('#priceChangeAlertBtn').addClass('hidden');
            $('#priceChangeAlertCheckYourEmail').removeClass('hidden');
        },

        showAddedToPriceAlertsNotification: function () {
            $('#priceChangeAlertBtn').addClass('hidden');
            $('#priceChangeAlertAlreadySubscribed').removeClass('hidden');
        }

    };

    $(function () {
        if (fluxClickHandler.handlers) {
            fluxClickHandler.addHandler('signUpForPriceAlerts', priceAlert.signUpForPriceAlerts, priceAlert);
            fluxClickHandler.addHandler('createAlert', priceAlert.createAlert, priceAlert);
        }
    });

    flights.PriceAlert = priceAlert;
    return priceAlert;
});

/* static_content/default/default/scripts/exp/flights/flux/flights.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen:true */
/*global define, require, console */

define('flights', ['jquery', 'uitk', 'backbone', 'underscore', 'dctk/dctk', 'configuration'], function ($, uitk, Backbone, _, dctk, configuration) {

    'use strict';

    var flights = {
        collections: {},
        constructors: {},
        models: {},
        views: {},
        logging: {
            enabled: true
        }

    };

    Backbone.$ = $;
    flights.vent = _.extend({}, Backbone.Events);

    uitk.media.lazyBuffer = 1000;

    // @param message This can be either a string or an object.  It is the data
    // being written to the log.  If it is a string, that string will be
    // written to the console using console.log().  If it is an object, the
    // object will be written to the console using console.dir() for
    // inspection.
    // @description This writes a message to the console (if window.console
    // exists).
    flights.log = function (message) {
        if (window.console && flights.logging.enabled) {
            if (typeof message === 'object' && typeof console.dir === 'function') {
                console.dir(message);
            } else if (typeof message === 'string') {
                console.log(message);
            }
        }
    };

    flights.getDateObj = function (dateString, datePattern) {
        var pattern = /(-|\/|\.|,|\\)/g,
            separator,
            separators,
            datePatternArray,
            datePatternArrayLength = 0,
            dateArray,
            dateObj = new Date(),
            day, month, year, i;

        datePattern = datePattern || 'MM/dd/yy';

        if (dateString !== undefined) {

            separators = datePattern.match(pattern);
            if (separators !== null) {
                separator = separators[0];
            }
            dateString = dateString.replace(pattern, separator);

            datePatternArray = datePattern.split(separator);
            datePatternArrayLength = datePatternArray.length;
            dateArray = dateString.split(separator);

            for (i = 0; i < datePatternArrayLength; i += 1) {
                if (datePatternArray[i].indexOf('d') > -1) {
                    day = parseInt(dateArray[i], 10);
                } else if (datePatternArray[i].indexOf('M') > -1) {
                    month = parseInt(dateArray[i], 10);
                } else if (datePatternArray[i].indexOf('y') > -1) {
                    year = parseInt(dateArray[i], 10);
                    if (isNaN(year) || year >= 10000) {
                        year = dateObj.getFullYear();
                        if (month < dateObj.getMonth()) {
                            year = year + 1;
                        }
                    }
                    if (year < 100) {
                        year = year + 2000;
                    }
                }
            }

            return new Date(year, month - 1, day);
        }

        return new Date(null);
    };

    flights.utils = {

        objToStringArray: function (obj, prefix, maxLength) {

            var keyValueStrings = [],
                key,
                value;

            if ('object' !== typeof obj) {
                return;
            }

            prefix = 'string' === typeof prefix ? prefix : '';

            // Default max length is 50 characters.
            maxLength = 'number' === typeof maxLength ? maxLength : 50;

            for (key in obj) {
                if (obj.hasOwnProperty(key)) {

                    value = obj[key];
                    if ('string' === typeof value ||
                        'number' === typeof value ||
                        'boolean' === typeof value) {

                        keyValueStrings.push((prefix + key + '=' + value.toString().substring(0, maxLength)).replace(/\.| /g, ''));
                    } else if (null !== value && 'object' === typeof value) {

                        keyValueStrings = keyValueStrings.concat(this.objToStringArray(value, key + '-'));
                    }
                }
            }

            return keyValueStrings;
        }
    };

    if (!Date.prototype.addDays) {
        Date.prototype.addDays = function (days) {
            var newDate = new Date(this.valueOf());
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        };
    }

    if (!Date.prototype.stringFromPattern) {
        Date.prototype.stringFromPattern = function (datePattern) {

            var separatorPattern = /(-|\/|\.|,|\\)/g,
                separators = datePattern.match(separatorPattern),
                separator,
                patternSegments = [],
                patternSegment,
                i,
                dateSegments = [];

            /* If for some reason there exists more than one separator (-/.,\)
             * in datePattern, use the first and update the datePattern so it
             * is consistent.
             */
            if (separators === null) {
                return ''; // Can't do much with nothing.
            }

            separator = separators[0];

            datePattern = datePattern.replace(separatorPattern, separator); // Ensure that all date separators in the pattern are the same.

            patternSegments = datePattern.split(separator);

            for (i = 0; i < patternSegments.length; i += 1) {
                patternSegment = patternSegments[i].toLowerCase();
                if (patternSegment.indexOf('d') > -1) {
                    dateSegments.push(this.getDate());
                } else if (patternSegment.indexOf('m') > -1) {
                    dateSegments.push(this.getMonth() + 1);
                } else if (patternSegment.indexOf('y') > -1) {
                    dateSegments.push(this.getFullYear());
                }
            }

            return dateSegments.join(separator);

        };
    }

    if(!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/(^\s+)|(\s+$)/g, '');
        };
    }

    // REQUIRED FOR IE < 9 - FILTER IS USED TO EXCLUDE EBF OFFERS WHEN SORTING //
    if (!Array.prototype.filter) {
        Array.prototype.filter = function (filterFunction) {
            var original,
                length,
                results = [],
                parameter = arguments[1],
                value,
                i;

            if (this === null || typeof filterFunction !== 'function') {
                throw new TypeError();
            }

            /* >>> is the unsigned right shift operator; it ensures that len is an unsigned 32-bit integer.
             * This does not lint successfully on either jsLint or jsHint; this is understood and acceptable.
             */
            original = Object(this);
            length = original.length >>> 0;
            for (i = 0; i < length; i++) {
                if (i in original) {
                    value = original[i]; // in case fun mutates this
                    if (filterFunction.call(parameter, value, i, original)) {
                        results.push(value);
                    }
                }
            }
            return results;
        };
    }

    return flights;

});
/* static_content/default/default/scripts/exp/flights/flux/domReady.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

require(['jquery', 'flights', 'uitk', 'applicationView'], function ($, flights, uitk, ApplicationView) {
	
	'use strict';
	
	$(function () {

		flights.views.applicationView = new ApplicationView();

        /* as the responsive screen changes, set aria-hidden for needed sections */
        uitk.subscribe('mediaquery.matched', function(topic, data) {
            if ( data.key === 'tablet' || data.key === 'smallTablet') {
                $('.col.a-col').attr('aria-hidden', 'true');
            }
            if (data.key === 'desktop' ) {
                $('.col.a-col').removeAttr('aria-hidden');
            }
        });
        uitk.mediaquery.publishAgain();

        /* when using filter button, show aria-hidden when filters are closed...*/
        uitk.subscribe('off-canvas.stateChanged', function (topic, state) {
            if (state === 'open') {
                $('.col.a-col').removeAttr('aria-hidden');
            } else {
                $('.col.a-col').attr('aria-hidden', 'true');
            }
        });
	});

});
/* static_content/default/default/scripts/exp/flights/flux/interstitial.js */
/*global Flights, setTimeout */

define('interstitial', ['flights', 'jquery', 'uitk', 'i18n', 'configuration'], function (flights, $, uitk, i18n, configuration) {

    'use strict';

    var Interstitial = {},
        defaultProgressBarConfig = {
            elements: $('.outbound-interstitial .progress-bar'),
            duration: 15000,
            increment: (configuration.perceivedInstantEnabled) ? 0.1 : 1,
            finalizingPricesPercent: 80,
            stopPercent: 90
        },
        finalizingPricesInterval,
        titleElementSelector = '.primary-msg',
        secondaryMessageSelector = '.secondary-msg',
        spinnerSelector = '.loader',
        adSelector = '.ad',
        progressBarSelector = '.progress-bar',
        fillSelector = '.fill',
        completedAttribute = 'completed'; // Prevent progress bar updates after zooming to 100%.

    function updateProgressBar(elements, percent) {
        if (true === elements instanceof $) {
            $.each(elements, function (index, element) {
                $(element).find(fillSelector).css('width', percent + '%');
            });
        }
    }

    function changeProgressBarMessage(messagesCount, messageIndex, percent) {
        return messagesCount > 0 &&
            messageIndex < messagesCount &&
            percent >= (100 * (messageIndex + 1) / messagesCount);
    }

    Interstitial.show = function (elements, progressBarConfig) {

        var progressBarSettings = $.extend(progressBarConfig, defaultProgressBarConfig);

        if (true === elements instanceof $) {
            $.each(elements, function (index, element) {

                var $element = $(element),
                    averageDelay = progressBarSettings.duration / (progressBarSettings.stopPercent / progressBarSettings.increment),
                    messages = i18n.interstitial.messages,
                    message = '',
                    messagesCount = messages.length,
                    messageIndex = 0;

                $element.removeData(completedAttribute);

                $element.find(titleElementSelector).show();
                uitk.utils.liveAnnounce(messages[messageIndex], 'assertive');
                $element.show();
                $element.find(secondaryMessageSelector).show();
                $element.find(adSelector).show();
                $element.find(progressBarSelector).show();

                function iterate(percent) {
                    if (changeProgressBarMessage(messagesCount, messageIndex, percent)) {
                        message = messages[messageIndex += 1];
                        $element.find(titleElementSelector).text(message);
                        uitk.utils.liveAnnounce(message, 'assertive');
                    }

                    setTimeout(function () {
                        if (percent <= progressBarSettings.stopPercent) {
                            if (true !== $element.data(completedAttribute)) {
                                updateProgressBar(progressBarSettings.elements, percent);
                                iterate(percent + progressBarSettings.increment);
                            }
                        } else if (percent >= progressBarSettings.finalizingPricesPercent) {
                            //Announce 'finalizing prices' message repeatedly if search takes too long
                            finalizingPricesInterval = setInterval(function () {
                                uitk.utils.liveAnnounce(messages[messagesCount - 1], 'assertive');
                            }, 2000);
                        }
                    }, averageDelay);

                }

                iterate(0);

            });
        }
    };

    Interstitial.hide = function (elements) {
        clearInterval(finalizingPricesInterval);
        if (true === elements instanceof $) {
            $.each(elements, function (index, element) {

                var $element = $(element),
                    messages = i18n.interstitial.messages;

                $element.find(titleElementSelector).text(messages[messages.length - 1]);
                updateProgressBar($element, 100);
                $element.data(completedAttribute, true);

                // Ensure that the progress bar is visible at 100% for a bit before hiding.
                setTimeout(function () {
                    $element.hide();
                    $('.outbound-interstitial').hide();
                    if(configuration.perceivedInstantEnabled) {
                        $('.pi-progress-show').removeClass('pi-progress-show');
                    }
                }, 250);

                $('.outbound-spinner').hide();
            });
        }
    };

    flights.interstitial = Interstitial;
    return Interstitial;
});
/* static_content/default/default/scripts/exp/flights/flux/feedback.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('feedback', ['flights', 'jquery', 'fluxClickHandler'], function(flights, $, fluxClickHandler) {

    'use strict';

    var feedback = {};

    function openFeedbackForm(){
        var sW = screen.width,
            sH = screen.height,
            popUpObj,
            feedbackUrl = '/p/info-other/feedback.htm?';


        //check for localized version
        if ($('#feedbackURL_OL').length === 1) {
            feedbackUrl = $('#feedbackURL_OL').attr('data-url');
        }

        if (typeof OpinionLab_FB !== 'undefined') {
            if (typeof OpinionLab_FB.O_HT !== 'undefined') {
                feedbackUrl += 'referer=' + OpinionLab_FB.O_HT();
            }
            if (typeof OpinionLab_FB.O_CV !== 'undefined') {
                feedbackUrl += '&customvar=' + OpinionLab_FB.O_CV();
            }
            if (typeof OpinionLab_FB.O_PRV !== 'undefined') {
                feedbackUrl += '&prev=' + OpinionLab_FB.O_PRV();
            }
        }

        popUpObj = window.open(
            feedbackUrl,
            'ModalPopUp',
            'toolbar=no,' +
                'scrollbars=no,' +
                'location=no,' +
                'statusbar=no,' +
                'menubar=no,' +
                'resizable=no,' +
                'width=635px,' +
                'height=280px,' +
                'screenX=' + ((sW - 535) / 2) + ',' +
                'screenY=' + ((sH - 192) / 2) + ',' +
                'left=' + ((sW - 535) / 2) + ',' +
                'top=' + ((sH - 192) / 2));

        popUpObj.focus();

        return feedbackUrl;
    }

    feedback.showLink = function(){
        $('#feedbackAndImprovements').removeClass('hide');
    };

    $(function(){
        fluxClickHandler.addHandler('showFeedback', openFeedbackForm);
    });

    return feedback;
});
/* static_content/default/default/scripts/exp/flights/flux/ads.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('ads', ['flights', 'jquery', 'uitk', 'dctk/dctk', 'IntentMediaModule', 'configuration'], function(flights, $, uitk, dctk, IntentMediaModule, configuration) {

    'use strict';

    var ads = {},
        intentMedia = new IntentMediaModule({
                desktopPosition: function(){ return configuration.ads.intentMedia.placementPosition; },
                mobilePosition: function(){ return configuration.ads.intentMedia.placementPosition; }
            });

    function trackImpressions(){
        var adsImpressions = [];

        if ($('#dcol_content iframe').length > 0 && configuration.ads.enabledInCol === true) {
            adsImpressions.push('DcolAds');
        }
        if ($('#small-adsense-footer').length > 0 && configuration.ads.enabledInFooter === true) {
            adsImpressions.push('FooterAds');
        }
        if ($('#intentMediaAdPlacement div').length > 0) {
            adsImpressions.push('AcolIntent');
        }
        if ($('.intent-media div').length > 0) {
            adsImpressions.push('IntentIntercard');
        }

        if (adsImpressions.length > 0) {
            flights.Analytics.trackAction(adsImpressions.join('|'));
        }
    }

    function showAds() {

        var afsConfiguration,
            $msURL = $('#mediaSolutionsTrackingUrlValid'),
            $opmURL = $('#OPMTrackingUrlValid');

        try {

            // UPDATE THE IFRAME SRC TO BE THE VALUE OF THE SRC DATA ATTRIBUTE, WHICH WILL LOAD CONTENTS //
            $msURL.attr('src', $msURL.data('src'));
            $opmURL.attr('src', $opmURL.data('src'));

            require(['expads'], function(expads) {
                if (typeof expAdsCsa !== 'undefined') {

                    afsConfiguration = $.parseJSON($('#afsConfigurationData').html());
                    if(afsConfiguration) {
                        afsConfiguration.product = "flights";
                        expads.adSenseContainers = expads.adSenseContainers || {};
                        expads.adSenseContainers.adsense_dcol_container = function (id) {
                            if(configuration.path.isFlightOnly) {
                                afsConfiguration.adLayout = 'sellerFirst';
                            }
                            expAdsCsa.setAfsConfiguration(afsConfiguration);
                            var adBlocks = [];
                            adBlocks.push(expAdsCsa.get_csa_dcol_adblock(id, '3', '140px'));
                            adBlocks.push(expAdsCsa.get_csa_footer_adblock('medium-adsense-footer-content-section1', '2', '305px'));
                            adBlocks.push(expAdsCsa.get_csa_footer_adblock('medium-adsense-footer-content-section2', '2', '305px'));
                            expAdsCsa.call(adBlocks);
                        };

                        expads.adSenseContainers['small-adsense-footer'] = function (id) {
                            afsConfiguration.adLayout = null;
                            expAdsCsa.setAfsConfiguration(afsConfiguration);
                            var adBlocks = [];
                            adBlocks.push(expAdsCsa.get_csa_footer_adblock('small-adsense-footer-content-section1', '2', '305px'));
                            adBlocks.push(expAdsCsa.get_csa_footer_adblock('small-adsense-footer-content-section2', '2', '305px'));
                            expAdsCsa.call(adBlocks);
                        };
                    }
                }

                expads.ensureVisibleAdsAreLoaded(); // Loads any ads that have not already been loaded; won't change any ads that were already loaded
                // Global Rollout of Pin R2 to all BEX Group
                expads.extensions.clingyAds.init('div[data-omniture-rfrr="Dcol.Ad.Bottom"]', '#dcol_content', 'div[data-omniture-rfrr="Dcol.Adsense"]', 'footer');

            });
        } catch (error) {
            dctk.loggingAdapter.logError('Try Catch', error, ['origin=flights.ads.showAds', 'errorSrc=FLUX']);
        }

    }

    ads.show = function(){
        showAds();
        trackImpressions();
        ads.refreshIntentMedia();
        if(( configuration.path.isFlightHotel || configuration.path.isFlightHotelCar || configuration.path.isFlightCar ) && configuration.ads.isInlineBannerEnabled ) {
            ads.loadInlineBanner();
        }
        if( configuration.path.isFlightOnly && configuration.route.isRoundTrip ) {
            ads.loadInlineBanner('flight');
        }
        if (configuration.ads.isReplaceWSWUbyDcolAds) {
            ads.replaceWSWUbyDcolAds();
        }
    };

    ads.refreshIntentMedia = function(){
        if (!configuration.ads.intentMedia.suppress) {
            intentMedia.insertIntentMediaListingPlaceholders();
            intentMedia.refresh();
        }
    };

    ads.loadInlineBanner = function(packageType){
        require(['expads', 'inlineBannerModule'], function (expads, inlineBannerModule) {
            inlineBannerModule.insertInlineBanners(packageType);
            expads.ensureVisibleAdsAreLoaded(); // Loads any ads that have not already been loaded; won't change any ads that were already loaded
        });
    };
    
    ads.replaceWSWUbyDcolAds = function(){
        var position;
        if ($('#dcol_content:visible').length) {
            if( $('#alertBox:visible').children().length ) {
                position = $("#alertBox").offset();
            } else {
                position = $("#sortBar").offset();
            }
            $("#dcol_content").offset({ top: position.top });
        }
    }

    flights.vent.on('filtersView.filterSelected', function () {
        $('.inline-banner').remove();
        require(['expads'], function(expads) {
            if(configuration.ads.refreshDisplayAdsOnFilter === true) {
                expads.refresh();
            }
        });
        if (configuration.ads.isReplaceWSWUbyDcolAds) {
            ads.replaceWSWUbyDcolAds();
        }
    });

    flights.vent.on('uiModel.resetViewableOffers', function() {
        ads.refreshIntentMedia();
        if(( configuration.path.isFlightHotel || configuration.path.isFlightHotelCar || configuration.path.isFlightCar ) && configuration.ads.isInlineBannerEnabled ) {
            ads.loadInlineBanner();
        }
        if( configuration.path.isFlightOnly && configuration.route.isRoundTrip ) {
            ads.loadInlineBanner('flight');
        }
    });

    flights.vent.on('router.selectedLegs router.noSelectedLegs', function() {
        require(['expads'], function(expads) {
            expads.refresh();
        });
    });

    flights.vent.on('discovery.rendered discovery.closeModule', function() {
        if (configuration.ads.isReplaceWSWUbyDcolAds) {
            ads.replaceWSWUbyDcolAds();
        }
    });

    return ads;
});

/* static_content/default/default/scripts/exp/flights/flux/nativeAds.js */
require(['jquery', 'adtoolkit/experiments', 'expads'], function ($, adexperiments, expads) {
    'use strict';

    var standAloneExperiment = 'DFPNativeImageLinksStandAloneFSR',
        packagesExperiment = 'DFPNativeImageLinksPkgFSR',
        nativeAd = document.getElementById('native_ad'),
        adsense = document.getElementById('gtFooterContainer'),
        nativeAdExperiment;


    if (adsense !== null && nativeAd !== null) {

        if (adexperiments.hasExperiment(standAloneExperiment)) {
            nativeAdExperiment = adexperiments.getExperimentByName(standAloneExperiment);
        } else if (adexperiments.hasExperiment(packagesExperiment)) {
            nativeAdExperiment = adexperiments.getExperimentByName(packagesExperiment);
        }

        if (nativeAdExperiment !== undefined) {
            if ($(window).width() < 1024) {
                nativeAdExperiment.exposureLog();
                if (nativeAdExperiment.bucket === 1) {
                    nativeAd.style.display = 'block';
                }
                else {
                    adsense.style.display = 'block';
                }
            }
            else {
                adsense.style.display = 'block';
            }
        }
    }
    expads.utils.showParentDivForNonEmptyAdUnit('dfp-module-header', 'CF');
});


/* static_content/default/default/scripts/exp/flights/flux/intentMedia.js */
/*jslint browser: true, unparam: true, todo: true */
/*global define, require, console, IntentMedia, window */

define('IntentMediaModule', ['jquery'], function ($) {

    'use strict';

    function createLiElement(adData) {
        var target = adData.target,
            index = adData.index,
            id = 'IntentMedia' + (target === 'Desktop' ? 'Result' : target) + 'Ad' + index,
            omnitureRfrr = 'Inline.Intent.' + target + '.Ad' + index,
            classes = 'segment intent-media intent-media-ad-' + target.toLowerCase();

        $('#' + id).remove();

        return $('<li/>').addClass(classes).attr({
            'id': id,
            'data-click-handler': 'omnitureClickHandler',
            'data-omniture-rfrr': omnitureRfrr
        });
    }

    function intentMediaTracking() {
        var screenSize;

        if (window.innerWidth < 726) {
            screenSize = 'phone';
        } else if (window.innerWidth < 960) {
            screenSize = 'tablet';
        } else if (window.innerWidth < 1176) {
            screenSize = 'mid_screen';
        } else {
            screenSize = 'full_screen';
        }

        $.extend(window.IntentMediaProperties, {
            'screen_size' : screenSize
        });
    }

    function onBrowserResize() {
        $(window).resize(function () {
            intentMediaTracking();
        });
    }

    var IntentMediaModule = function (options) {

        intentMediaTracking();
        onBrowserResize();

        var resultsAds = [{
                index: 1,
                position: options.desktopPosition,
                target: 'Desktop'
            }, {
                index: 1,
                position: options.mobilePosition,
                target: 'Mobile'
            }];
        return {
            insertIntentMediaListingPlaceholders : function () {
                var allVisibleModules = $('#flightModuleList').find('.flight-module:not(.hide)'),
                    lastModule = allVisibleModules.last(),
                    moduleLength = allVisibleModules.length,
                    insertInList = function (number, intentMediaElement) {
                        if (moduleLength > number - 1) {
                            allVisibleModules.eq(number - 1).after(intentMediaElement);
                        }
                    },
                    appendAtBottom = function (number, intentMediaElement) {
                        if (moduleLength <= number - 1) {
                            lastModule.after(intentMediaElement);
                        }
                    },
                    i = 0,
                    element;

                if (moduleLength > 0) {
                    for (i = resultsAds.length - 1; i >= 0; i -= 1) {
                        element = createLiElement(resultsAds[i]);
                        insertInList(resultsAds[i].position(), element);
                        appendAtBottom(resultsAds[i].position(), element);

                    }
                }
            },
            refresh : function () {
                if (typeof IntentMedia !== "undefined") {
                    IntentMedia.Event.trigger('IntentMediaRefresh');
                }
            }
        };
    };

    return IntentMediaModule;
});
/* static_content/default/default/scripts/exp/flights/flux/fluxClickHandler.js */
/*jslint browser: true, eqeq: true */
/*global jQuery, Flights, dctk, uitk, TLT */

define('fluxClickHandler', ['flights', 'jquery', 'uitk', 'dctk/dctk'], function(flights, $, uitk, dctk) {

    "use strict";

    var ClickHandler = {};

    ClickHandler.touchmove = false;

    ClickHandler.handlers = {};
    ClickHandler.defaultElementQuery = '.click-handler-range';
    ClickHandler.elementQuery = ClickHandler.defaultElementQuery;

    ClickHandler.disableAllInput = function () {
        $("*").off();
    };

    ClickHandler.setElementQuery = function (queryString) {
        ClickHandler.elementQuery = queryString;
    };

    ClickHandler.registerHandler = function () {
        $(document).on('touchmove', ClickHandler.elementQuery, function (event) {
            ClickHandler.touchmove = true;
        });

        // uitk.clickEvent does not work with hand held devices (consistent issue reproducing on iPad), so
        // changing to use standard click event. Once issues with uitk.clickEvent not working on iPad are resolved
        // then we should go back to using uitk.clickEvent
        $(document).on(uitk.clickEvent, ClickHandler.elementQuery, function (event) {
            ClickHandler.dispatchHandler(event);

            if( event.type === 'touchend' ) {
                ClickHandler.touchmove = false;
            }
        });
    };

    /**
     * There is also a pubsub event 'Flights.addClickHandler' for adding click handlers that calls this function.
     * The subscription/consumption implementation is in ClickHandler.init().
     */
    ClickHandler.addHandler = function (name, handler, context) {
        ClickHandler.handlers[name] = {handler: handler, context: context};
    };

    ClickHandler.dispatchHandler = function (event) {
        var recordInTealeaf = false,
            target = event.srcElement || event.target,
            clickHandlerId = target.attributes['data-click-handler'],
            isStopEventPropagation = target.attributes['data-stop-propagate'] !== undefined && target.attributes['data-stop-propagate'].value === 'true',
            isPreventDefault = target.attributes['data-prevent-default'] !== undefined && target.attributes['data-prevent-default'].value === 'true',
            handlerList,
            parent;

        if(isPreventDefault) {
            event.preventDefault();
        }

        if (isStopEventPropagation) {
            event.stopPropagation();
        }

        if (clickHandlerId === undefined) {
            parent = target.parentNode;
            while (parent !== undefined && parent != document) {
                clickHandlerId = parent.attributes['data-click-handler'];
                if (clickHandlerId !== undefined) {
                    target = parent;
                    break;
                }
                parent = parent.parentNode;
            }
        }

        if (clickHandlerId !== undefined) {
            handlerList = clickHandlerId.nodeValue;

            // multiple event handlers, separated by commas,
            // are processed left to right
            var handlerIds = handlerList.split(',');
            for (var i = 0; i < handlerIds.length; i++) {
                var handlerName = handlerIds[i];
                var clickHandler = ClickHandler.handlers[handlerName].handler;
                var clickHandlerContext = ClickHandler.handlers[handlerName].context;
                if (clickHandler === undefined) {
                    continue;
                }
                clickHandler(target, event, clickHandlerContext);
                recordInTealeaf = true;
            }

            //TLT is part of the TealeafSDK.js file, and is in the global namespace
            if (typeof TLT !== 'undefined' && recordInTealeaf) {
                TLT.processDOMEvent(event);
            }
        }
    };

    ClickHandler.preventInadvertentTriggerOnIpad = function(event,  fnCallback, executeOnOtherDevice){
        var isIpad = (-1 < navigator.userAgent.indexOf('iPad'))
            , isSafari = ($.browser.safari !== undefined)
            , isClick = (event !== undefined && event.type === 'click')
            , isTouchend = (event !== undefined && event.type === 'touchend');
        executeOnOtherDevice = (typeof executeOnOtherDevice === 'boolean' ? executeOnOtherDevice : true);

        if(isIpad && isSafari) {
            if(isClick) {
                event.stopPropagation();
                event.preventDefault();
                return;
            } else if(isTouchend && !ClickHandler.touchmove) {
                if(typeof fnCallback === 'function') {
                    fnCallback();
                }
            }
        } else if( executeOnOtherDevice ) {
            if(typeof fnCallback === 'function') {
                fnCallback();
            }
        }
    };

    ClickHandler.init = function () {
        ClickHandler.registerHandler();
    };

    $(function () {
        ClickHandler.init();
    });

    flights.ClickHandler = ClickHandler;
    return ClickHandler;
});


/* static_content/default/default/scripts/exp/flights/flux/selectFlight.js */
/*jslint browser: true, eqeq: true, nomen: true */
/*global define */

define('selectFlight', ['flights', 'jquery', 'fluxClickHandler', 'forceChoiceModalView', 'uitk', 'dctk/dctk', 'configuration', 'progress', 'underscore', 'experiments', 'detectizr', 'sitebrand', 'i18n'],
    function (flights, $, fluxClickHandler, ForceChoiceModalView, uitk, dctk, configuration, progress, _, experiments, detectizr, sitebrand, i18n) {

        'use strict';
        var browser = $.browser,
            userAgent = navigator.userAgent,
            continuationId = $('#originalContinuationId').text(),
            isIPad = (userAgent.indexOf('iPad') > -1),
            isSafari = (browser.safari !== undefined),
            sessionStorage = uitk.createBrowserStorage('session'),

            SelectFlight = {

                isSplitTicket: false,
                isPackageable: false,
                crossSellModel: undefined,
                router: undefined,
                selectedOutboundSuperlatives: undefined,

                flightSelectClickHandler: function (target, event) {
                    var buttonData = $(target).data();

                    if (undefined === buttonData.tripId) {
                        flights.log('Error in selectFlight(tripId = ' + buttonData.tripId + ')');
                        return;
                    }

                    if (buttonData.isCached && experiments.getVariant(13327) > 0) {
                        // Call for RoundTrip.In from cached result (prevents second ajax call) - comment will be removed.
                        return;
                    }

                    if (true === configuration.view.isByot) {
                        require(['setupRouter'], function (setupRouter) {
                            SelectFlight.router = setupRouter();
                        });
                    }

                    SelectFlight.isSplitTicket = buttonData.isSplitTicket;
                    SelectFlight.isPackageable = buttonData.isPackageable;

                    if(SelectFlight.shouldMoveToNextLeg(buttonData)) {
                        SelectFlight.selectedOutboundSuperlatives = buttonData.superlatives;
                        SelectFlight.moveToNextLeg(buttonData.leg0NaturalKey);
                    } else {
                        dctk.logging.logTrxEvent('returnLegSelected', ['clEventName01=FLUX_TimeToUDP', 'clEventTime01=' + (new Date().getTime() -  dctk.logging.pageStartTime)]);
                        experiments.execute('FSR_FC_EB_Ch_Fi', buttonData);
                        if(SelectFlight.shouldShowForcedChoiceModal(buttonData)) {
                            SelectFlight.showForcedChoiceModal(buttonData);
                        } else {
                            if(configuration.isFlexibleShoppingEnabled === true){
                                uitk.publish('results.complete', {contentId: '.site-content-wrap'});
                            }
                            SelectFlight.redirectToUDP(buttonData);
                        }
                    }

                    uitk.publish('Flights.Selected.Flight');
                    event.stopPropagation();
                },

                shouldMoveToNextLeg: function(buttonData){
                    return (true !== buttonData.bargainFare && configuration.view.isByot && SelectFlight.router.getNextLegToView() === 0);
                },

                moveToNextLeg: function(legKey){
                    SelectFlight.router.navigate(SelectFlight.router.getFluxFragmentPrefix() + legKey, {trigger: true});
                },

                getForbiddenCarriers: function () {
                    var forbiddenAirlines = configuration.xsell.hotel.forcedChoice.forbiddenAirlines;
                    return (forbiddenAirlines && forbiddenAirlines.length) ?
                            forbiddenAirlines.split(',') : undefined;
                },

                isAirlineEligible: function (airlineCodes, forbiddenCarriers) {

                    if (undefined === forbiddenCarriers) {
                        return true;
                    }
                    var outbound = (undefined !== airlineCodes.outboundAirlineCodes) ? airlineCodes.outboundAirlineCodes.split(',') : undefined,
                        inbound = (undefined !== airlineCodes.inboundAirlineCodes) ? airlineCodes.inboundAirlineCodes.split(',') : undefined;

                    if (undefined === outbound || undefined === inbound) {
                        return true;
                    }

                    if (_.intersection(outbound, forbiddenCarriers).length >= 1) {
                        return false;
                    }
                    if (_.intersection(inbound, forbiddenCarriers).length >= 1) {
                        return false;
                    }
                    return true;
                },

                getDurationOfTripInDays: function(){
                    var departureDate = flights.getDateObj(
                        flights.Model.Wizard.departure.date,
                        flights.Model.Wizard.calendar.dateFormat
                    );

                    var arrivalDate = flights.getDateObj(
                        flights.Model.Wizard.arrival.date,
                        flights.Model.Wizard.calendar.dateFormat
                    );

                    var duration = arrivalDate - departureDate;

                    return Math.floor(duration / 86400000);
                },

                shouldShowForcedChoiceModal: function (buttonData) {
                    var isMobile = detectizr.device.type === 'mobile';

                    if (SelectFlight.isCrossSellEnabled(buttonData)){
                        experiments.execute('MIS_BundledSavings_Attach_MVP_Mobile');
                        experiments.execute('MIS_BundledSavings_Attach_MVP');
                    } else {
                        return false;
                    }

                    return !(configuration.xsell.hotel.forcedChoice.enabled === false ||
                        isMobile || configuration.xsell.bundledSaving.enabled === true );
                },

                isCrossSellEnabled: function(buttonData){
                    var isIE8 = ($.browser.msie !== undefined && $.browser.version.indexOf('8.') === 0);

                    var durationOfTrip = this.getDurationOfTripInDays();

                    var airlineCodes = {
                        outboundAirlineCodes: buttonData.outboundAirlinecodes || undefined,
                        inboundAirlineCodes: buttonData.inboundAirlinecodes || undefined
                    };

                    var isAirlineEligible = this.isAirlineEligible(airlineCodes, this.getForbiddenCarriers()) === true;

                    return isIE8 === false &&
                        configuration.route.isRoundTrip &&
                        !buttonData.bargainFare &&
                        buttonData.hasFare &&
                        durationOfTrip > 0 &&
                        durationOfTrip <= 26 &&
                        isAirlineEligible === true;
                },

                showForcedChoiceModal: function(buttonData){
                    var forcedChoiceModal = new ForceChoiceModalView(buttonData, SelectFlight.crossSellModel, {
                            useAlertnateXsellChoice: sitebrand.siteid === '1'
                        });
                    $('#xSellHotelForcedChoice').scrollTop();

                    return forcedChoiceModal;
                },

                redirectToUDP: function (buttonData) {
                    var tripId = buttonData.tripId,
                        bargainFare = buttonData.bargainFare,
                        addHotelPackage = buttonData.addHotelPackage || false,
                        routeType = $('#flightRouteType').val(),
                        $loadingImg = $('#progressAlert img'),
                        xsellPreference = uitk.createBrowserStorage('session').readItem("xsellchoicekey") || "normal",
                        url,
                        hasFare = buttonData.hasFare,
                        resultToken = buttonData.resultToken,
                        legsIndexes = buttonData.legIndexes,
                        openInNewTab = configuration.udp.openInNewTab && configuration.path.isFlightOnly;

                    if (configuration.isFlexibleShoppingEnabled === true){
                        uitk.publish('results.changed', {
                            contentId: '.site-content-wrap',
                            scrollToTop: true,
                            message: '<p>' + i18n.searching.interstitial.packageInterstitial + '</p>',
                            screenReaderMsg: i18n.searching.interstitial.packageInterstitial ,
                            showLoader: false,
                            disable: true
                        });
                    } else {
                        progress.show('#udpAlertTitle');
                    }

                    if (isIPad && isSafari) {
                        setTimeout(function () {
                            progress.hide();
                        }, 5000);
                    }


                    if(configuration.xsell.bundledSaving.enabled === true && SelectFlight.isCrossSellEnabled(buttonData)){
                        xsellPreference = "showbundledsavingonly";
                    } else if (sitebrand.siteid === '1' && routeType === '2') {
                        xsellPreference = 'showhotelbanneronly';
                    }

                    if (!hasFare && !bargainFare) {
                        url = SelectFlight.flightDetailsUrlForCTP(xsellPreference, addHotelPackage, legsIndexes, resultToken, buttonData.isSplitTicket);
                    } else {
                        url = SelectFlight.flightDetailsUrl(xsellPreference, addHotelPackage, tripId, buttonData.isSplitTicket, buttonData.superlatives, buttonData.isCached);
                        url = SelectFlight.addPackageDetailsUrlParameters(url, buttonData);
                    }

                    if (configuration.loyalty.partnerPointsEnabled) {
                        url = SelectFlight.addPartnerLoyaltyUrlParameters(url, buttonData);
                    }

                    if(openInNewTab) {
                        window.open(url,'_blank').opener = null;
                    } else {
                        SelectFlight.openUrlInSameTab(url);
                    }
                    progress.hide();

                    $loadingImg.prop('src', $loadingImg.prop('src'));
                },

                flightDetailsUrl: function (xsellPreference, addHotelPackage, tripId, isSplitTicket, leg2Superlatives, isCachedOffer) {
                    var leg1Superlatives = SelectFlight.selectedOutboundSuperlatives !== undefined ? SelectFlight.selectedOutboundSuperlatives : leg2Superlatives,
                        endpoint = isCachedOffer ? 'Flight-Details-PI' : 'Flight-Search-Details';

                    if(leg1Superlatives === ''){
                        leg1Superlatives = 'NA';
                    }

                    if(leg2Superlatives === ''){
                        leg2Superlatives = 'NA';
                    }

                    return (endpoint + '?c=' + continuationId +
                        '&tripId1=' + ' ' +
                        '&offerId=' + encodeURIComponent(tripId) +
                        '&leg1=' + leg1Superlatives +
                        '&leg2=' + leg2Superlatives +
                        '&xsellchoice=' + xsellPreference +
                        '&addHotelPackage=' + addHotelPackage +
                        '&isSplitTicket=' + isSplitTicket);
                },

                flightDetailsUrlForCTP: function (xsellPreference, addHotelPackage, legsIndex, resultToken, isSplitTicket) {
                    return ('/Flight-Select?c=' + continuationId +
                        '&rt=' + resultToken +
                        '&legs=' + legsIndex +
                        '&xsellchoice=' + xsellPreference +
                        '&addHotelPackage=' + addHotelPackage +
                        '&isSplitTicket=' + isSplitTicket);
                },

                addPackageDetailsUrlParameters: function (url, buttonData) {
                    if (buttonData.hotelData) {
                        url = url + '&hotelData=' + encodeURIComponent(buttonData.hotelData);
                    }
                    if (buttonData.carData) {
                        url = url + '&carData=' + encodeURIComponent(buttonData.carData);
                    }
                    return url;
                },

                addPartnerLoyaltyUrlParameters: function(url, buttonData) {
                    if (buttonData.rewardId) {
                        url = url + '&rewardId=' + encodeURIComponent(buttonData.rewardId);
                    }
                    return url;
                },

                openUrlInSameTab: function(url) {
                    window.location.assign(url);
                }
            };

        $(function () {
            fluxClickHandler.addHandler('select-flight', SelectFlight.flightSelectClickHandler);
            flights.vent.on('crossSellModel.updated', function (args) {
                SelectFlight.crossSellModel = args.crossSellModel;
            });
        });

        return SelectFlight;
    });

/* static_content/default/default/scripts/exp/flights/flux/scratchpadModal.js */
/* jslint browser: true, unparam: true, white: true, todo: true */
/* global define, require, console */

define('scratchpadModal', ['flights', 'jquery', 'uitk', 'handlebars', 'configuration', 'analytics', 'fluxClickHandler',
    'i18n', 'priceAlert', 'scratchpadModalPriceAlerts', 'experiments'],
    function (flights, $, uitk, handlebars, configuration, analytics, fluxClickHandler, i18n, priceAlert,
              scratchpadModalPriceAlerts, experiments) {
    'use strict';

    var ScratchpadModal = {
        model: {},
        searchParameters: null,
        initialize: function (searchParameters) {
            this.model.sessionStorage = uitk.createBrowserStorage('session');
            flights.vent.on('wizardView.beforeSearchIsSent', this.updateNumberOfSearches, this);

            this.searchParameters = searchParameters;
            this.maybeLaterBannerEnabled = configuration.scratchpadModal.maybeLaterBannerEnabled;

            scratchpadModalPriceAlerts.initialize({
                priceAlertVariant: configuration.priceAlerts.variant,
                parentView: this
            });
            ScratchpadModal.initializeStorage();
            uitk.subscribe('modal.close', this, this.onModalClose);
        },

        onModalClose: function (topic, modal) {
            if (modal.options.modalId === 'scratchpadOptin' && !priceAlert.isSubscribedToPriceAlerts) {
                this.optScratchpadLater(null, null, this);   
            }
        },

        optScratchpadLater: function (target, event, context) {
            var self = context;
            self.model.sessionStorage.saveAsJSON('scratchpadOptinStatus', self.model.userScratchpadOptinActivity.MAYBE_LATER);
            if(self.shouldShowMaybeLaterBannerWithEventsOnFSR() && this.maybeLaterBannerEnabled) {
                self.showOptinAlertLater();
            }
            uitk.utils.liveAnnounce(i18n.sorting.accessibility.sortedByPrice);
            uitk.utils.focusElement($('#wizardSearch'));
        },

        showMaybeLaterModuleBanner: function () {
            var scratchpadOptinStatus = this.model.sessionStorage.readJSONAsObject('scratchpadOptinStatus'),
                alertBoxDismissed = this.model.sessionStorage.readJSONAsObject('userClosedAlertBox');

            if (this.maybeLaterBannerEnabled && this.isUserNotOptedIn() && this.model.userScratchpadOptinActivity.MAYBE_LATER === scratchpadOptinStatus &&
                alertBoxDismissed !== true && this.shouldShowMaybeLaterBannerWithEventsOnFSR()) {
                ScratchpadModal.showOptinAlertLater();
            }
        },

        showOptinModal: function (isSearchDelta) {
            var scratchPadModalCloseButton,
                $sendMeNotesButton = $('#send-me-notes-button'),
                $scratchPadModal = $('#scratchpadOptin');

            uitk.modal.close();
            $scratchPadModal.attr('aria-hidden', 'true');
            $scratchPadModal.click();

            analytics.trackActionWithIncrement('FLT.SR.ScratchpadModal.Display', $('#scratchpadOptin.modal-wrap'));

            $sendMeNotesButton.attr('data-click-handler', 'createPriceAlertScratchpadModal,omnitureClickHandler');
            scratchPadModalCloseButton = $('#scratchpadOptin.modal-wrap button.modal-close');
            if (scratchPadModalCloseButton.length > 0) {
                scratchPadModalCloseButton.attr('data-click-handler', 'omnitureClickHandler');
                if (!isSearchDelta) {
                    scratchPadModalCloseButton.attr('data-omniture-rfrr', 'ScratchpadModalClose.Close');
                }
            }
        },

        showOptinAlertLater: function () {
            var container = $('div#alertBox');

            if (container.length === 0) {
                return;
            }

            container.empty();
            container.append(this.model.scratchpadOptinLaterAlert);
            container.removeClass('hide');

            if ($('#scratchpadOptinLaterAlert button span.alt').length > 0) {
                $('#scratchpadOptinLaterAlert button span.alt').html(i18n.scratchpadOptinAlertCloseButtonText.accessibility.closeButtonText);
            }
        },

        showOptinAlertSuccess: function () {
            if (priceAlert.isSubscribedToPriceAlerts) {
                priceAlert.showAddedToPriceAlertsNotification();
            }
        },

        afterSearchSuccess: function () {
            var searchesDone = this.model.sessionStorage.readJSONAsObject('numberOfSearches'),
                scratchpadOptinStatus = this.model.sessionStorage.readJSONAsObject('scratchpadOptinStatus');

            if (this.showModal(searchesDone, this.model, scratchpadOptinStatus)) {
                ScratchpadModal.showOptinModal(false);
                if ($('#scratchpadOptin-title').length > 0) {
                    $('#scratchpadOptin-title').attr('aria-live', 'assertive');
                }
            } else {
                ScratchpadModal.showMaybeLaterModuleBanner();
            }
        },

        updateNumberOfSearches: function (newSearchParameters) {
            var searchesDone = this.model.sessionStorage.readJSONAsObject('numberOfSearches');
            if (this.isDifferentSearch(newSearchParameters)) {
                this.model.sessionStorage.saveAsJSON('numberOfSearches', searchesDone + 1);
            }
        },

        initializeStorage: function () {
            var scratchpadOptinStatus,
                searchesDone,
                $sendMeNotesButton;

            $.extend(this.model, {
                userScratchpadOptinActivity: {
                    NO_ACTION: 'NO_ACTION',
                    OPTED_IN: 'OPTED_IN',
                    OPTED_OUT: 'OPTED_OUT',
                    MAYBE_LATER: 'LATER'
                },
                SHOW_SCRATCHPAD_MODAL_ON_SEARCHCOUNT: 2,
                REMOVE_OPTIN_SUCCESS_ALERT_ON_SEARCHCOUNT: 3
            });

            if (!this.model.sessionStorage.doesKeyExist('numberOfSearches')) {
                this.model.sessionStorage.saveAsJSON('numberOfSearches', 1);
            }

            if (!this.model.sessionStorage.doesKeyExist('scratchpadOptinStatus')) {
                this.model.sessionStorage.saveAsJSON('scratchpadOptinStatus', this.model.userScratchpadOptinActivity.NO_ACTION);
            }

            if (!this.model.sessionStorage.doesKeyExist('userClosedAlertBox')) {
                this.model.sessionStorage.saveAsJSON('userClosedAlertBox', false);
            }

            searchesDone = this.model.sessionStorage.readJSONAsObject('numberOfSearches');
            scratchpadOptinStatus = this.model.sessionStorage.readJSONAsObject('scratchpadOptinStatus');

            if (searchesDone >= this.model.SHOW_SCRATCHPAD_MODAL_ON_SEARCHCOUNT && ($.inArray(scratchpadOptinStatus, [this.model.userScratchpadOptinActivity.NO_ACTION, this.model.userScratchpadOptinActivity.MAYBE_LATER]) === -1)) {
                this.model.sessionStorage.saveAsJSON('numberOfSearches', 0);
                this.model.sessionStorage.saveAsJSON('scratchpadOptinStatus', this.model.userScratchpadOptinActivity.NO_ACTION);
                this.model.sessionStorage.saveAsJSON('userClosedAlertBox', false);
            }

            this.model.scratchpadOptinLaterAlert = handlebars.templates.scratchpadOptinLaterAlertTmpl;

            $sendMeNotesButton = $('#send-me-notes-button');
            if ($sendMeNotesButton.length > 0) {
                $sendMeNotesButton.attr('data-click-handler', 'createPriceAlertScratchpadModal,omnitureClickHandler');
                $sendMeNotesButton.attr('data-omniture-rfrr', 'ScratchpadSendSearches.Select');
            }
        },

        removeAlertBox: function () {
            var container = $('div#alertBox');

            if (container.length > 0) {
                container.empty();
                container.addClass('hide');
            }

            this.model.sessionStorage.saveAsJSON('userClosedAlertBox', true);
        },

        gotoScratchpadLinkHandler: function () {
            document.location.href = '/scratchpad';
        },

        onUpdateOptinStatus: function (optedIn, success) {
            if (success) {
                if (optedIn) {
                    this.model.sessionStorage.saveAsJSON('scratchpadOptinStatus', this.model.userScratchpadOptinActivity.OPTED_IN);
                    if ($('#OptInValue').length > 0) {
                        $('#OptInValue').val('yes');
                    }
                    uitk.modal.close();

                    priceAlert.isSubscribedToPriceAlerts = true;
                }
            } else if (optedIn) {
                uitk.modal.close();
            }
        },
        urlParam: function (name) {
            var results = new RegExp('[\?&amp;]' + name + '=([^&amp;#]*)').exec(window.location.href);
            if (results !== null && results[1]) {
                return decodeURIComponent(results[1]);
            }
            return null;
        },

        isUserOptedIn: function () {
            return ($('#OptInValue').length > 0 && $('#OptInValue').val() === '2');
        },

        isUserNotOptedIn: function () {
            return ($('#OptInValue').length > 0 && (($('#OptInValue').val() === '3' || $('#OptInValue').val() === '1') || ($('#OptInValue').val() === '0' && configuration.scratchpadModal.optinEnabled)));
        },

        showModal: function (searchesDone, model, scratchpadOptinStatus) {
            return this.isUserNotOptedIn() && searchesDone === this.model.SHOW_SCRATCHPAD_MODAL_ON_SEARCHCOUNT && this.model.userScratchpadOptinActivity.MAYBE_LATER !== scratchpadOptinStatus;
        },

        isDifferentSearch: function (newSearchParameters) {
            if (this.searchParameters.departure.airport !== newSearchParameters.legSearchInfoList[0].departureLocation) {
                return true;
            }
            if (this.searchParameters.arrival.airport !== newSearchParameters.legSearchInfoList[0].arrivalLocation) {
                return true;
            }
            if (this.searchParameters.departure.date !== newSearchParameters.legSearchInfoList[0].departureDate) {
                return true;
            }
            if (this.searchParameters.arrival.date !== newSearchParameters.legSearchInfoList[0].arrivalDate) {
                return true;
            }
            if (this.searchParameters.numberOfAdults !== newSearchParameters.travelerCategoryInfo.adultCount) {
                return true;
            }
            if (this.searchParameters.numberOfChildren !== newSearchParameters.travelerCategoryInfo.childCount) {
                return true;
            }

            if (this.searchParameters.preferredAirline !== newSearchParameters.airlinePreferenceCode) {
                return true;
            }

            if (this.searchParameters.nonStopOnly !== newSearchParameters.nonstopOnly) {
                return true;
            }
            if (this.searchParameters.refundableOnly !== newSearchParameters.refundableFlightsOnly) {
                return true;
            }

            return false;
        },

        shouldShowMaybeLaterBannerWithEventsOnFSR: function() {
            var eventsOnFSRBucket = experiments.getVariant(10538);
            if(eventsOnFSRBucket === 1 || eventsOnFSRBucket === 3) {
                return false;
            }
            return true;
        }
    };

    $(function () {
        fluxClickHandler.addHandler('removeAlertBox', ScratchpadModal.removeAlertBox, ScratchpadModal);
        fluxClickHandler.addHandler('gotoScratchpadLinkHandler', ScratchpadModal.gotoScratchpadLinkHandler, ScratchpadModal);
    });

    flights.ScratchpadModal = ScratchpadModal;
    return ScratchpadModal;
});

/* static_content/default/default/scripts/exp/flights/flux/omnitureClickHandler.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('omnitureClickHandler', ['flights', 'jquery', 'analytics', 'fluxClickHandler', 'globalWizard'], function(flights, $, analytics, fluxClickHandler, wizard) {

    'use strict';

    function omnitureClickHandler(target, event) {
        var $target = $(target),
            omnitureRfrrAttr = $target.attr('data-omniture-rfrr'),
            id = omnitureRfrrAttr;

        if (omnitureRfrrAttr === undefined) {
            return;
        }

        if ((omnitureRfrrAttr.indexOf('NEARBY') !== -1)) {
            wizard.searchParameters.nearbyAirportInteraction = true;
        }

        if ('FLT.SR.' !== id.substring(0, 7) && 'PKG.FSR.' !== id.substring(0, 8)) {
            id = 'FLT.SR.' + id;
        }

        analytics.trackAction(id, $target[0]);
        return;
    }

    $(function(){
        fluxClickHandler.addHandler('omnitureClickHandler', omnitureClickHandler);
    });

    return {};
});

require(['omnitureClickHandler']);
/* static_content/default/default/scripts/exp/flights/flux/progress.js */
/*jslint browser: true, white: true */
/*global jQuery, Flights, uitk */

/* This JavaScript file is responsible for creating the Progress object.
 *
 * IMPORTANT:  JSLint fails on the reserved word "undefined" with the message:
 * "Expected an identifier and instead saw 'undefined' (a reserved word)."
 * This pattern protects that symbol, but unfortunately fails linting.
 * This is expected.
 *
 * Functions declared with "Progress.functionName = " will be public methods
 * of the Progress object.
 *
 * Functions declared with "function functionName () {" will be private, and cannot
 * be accessed outside of the Progress object.
 */

define('progress', ['flights', 'jquery', 'uitk'], function(flights, $, uitk) {

    'use strict';

    var progress = {},
        defaults = {
            primaryText: '',
            secondaryText: '',
            showAd: false, /* hidden by default */
            showSearchHistoryMsg: false /* hidden by default */
        };

    progress.element = '#progressAlert';

    progress.showUntilEvent = function (event, messageElement) {
        if (typeof event === 'string') {
            uitk.subscribe(event, function () { progress.hide(); });
            progress.show(messageElement);
        }
    };

    progress.show = function (messageElement) {
        var progressMask = $('<div />').attr('id','progressMask');
        progressMask.appendTo('body').show();
        $(progress.element).show();
        $(messageElement).show();
    };

    progress.hide = function () {
        $(progress.element).hide().find('h3').hide();
        $('#progressMask').remove();
    };

    progress.fadePage = function () {
        $('.site-content').addClass('page-fade');
    };

    progress.unfadePage = function () {
        setTimeout(function(){
            $('.site-content').removeClass('page-fade');
            $(progress.element).hide().find('h3').hide();
        }, 510);
    };

    progress.showOnPageInterstitial = function(message) {
        uitk.publish('results.changed', {
            disable: true,
            message: message,
            showLoader: false
        });
        $('#bCol').addClass('overlay');
        $('#bCol :button').attr('disabled', true);
    };

    progress.showInterstitial = function (options) {

        var config = $.extend({}, defaults, options),
            $intstl = $('#interstitial'),
            $results = $('#flightModuleList');

        $intstl.removeClass('progressive-interstitial');
        $('#noflightsfoundfilter').hide();

        $intstl.find('.progress-bar').hide();

        if (config.primaryText !== '') {
            $intstl.find('.primary-msg').text(config.primaryText).show();
        }
        if (config.secondaryText !== '') {
            $intstl.find('.secondary-msg').text(config.secondaryText).show();
        }
        if (config.showAd === true) {
            $intstl.find('.ad').show();
        }
        if (config.showSearchHistoryMsg === true) {
            $intstl.find('.search-msg').show();
        }

        $intstl.find('.loader').css('display', 'inline-block');

        $('#feedbackAndImprovements').hide();
        $results.hide();
        $intstl.show();
    };

    progress.hideInterstitial = function () {
        var $intstl = $('#interstitial'),
            $results = $('#flightModuleList');

        $intstl.hide();

        $results.show();
        $('#feedbackAndImprovements').show();

        $intstl.find('.primary-msg, .secondary-msg').text('');
        $intstl.find('.ad, .search-msg').hide();

        uitk.publish('results.complete');
        $('#bCol').removeClass('overlay');
        $('#bCol :button').removeAttr('disabled');
    };

    flights.Progress = progress;
    return progress;
});

/* static_content/default/default/scripts/exp/flights/flux/collections/RouteHappyCollection.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, console */

define('routeHappyCollection', ['flights', 'backbone', 'underscore', 'uiModel', 'sitebrand', 'experiments', 'dctk/dctk'], function (flights, Backbone, _, uiModel, sitebrand, experiments, dctk) {
    'use strict';

  function errorHandler(options) {
    dctk.logging.logMessage('RouteHappyAjaxFailed', {
      statusCode: options.xhr.status,
      responseText: options.xhr.responseText
    });
  }

  var CollectionConstructor = Backbone.Collection.extend({
        url: '/flights/getrichcontent/v4',
        parse: function (response, options) {
            var parsedData = [],
                offerInfoList;

            if(('object' !== typeof response) || response.richInfoContentList === null || response.richInfoContentList === undefined) {
                errorHandler(options);
                return [];
            }

            offerInfoList = response.richInfoContentList.richInfoContent[0].odcontentList.odcontent;

            _.each(offerInfoList, function (offerInfo) {
                var parsedOffer = parseOfferData(offerInfo);

                if(undefined !== parsedOffer) {
                    parsedData.push(parsedOffer);
                }
            });

            return parsedData;
        },
        fetchRouteHappy: function() {
            var richContentRequest = this.getRequest(),
                request = richContentRequest.requestObject;

            if (request.richInfoList.richInfo[0] &&
                request.richInfoList.richInfo[0].odlist &&
                request.richInfoList.richInfo[0].odlist.od &&
                request.richInfoList.richInfo[0].odlist.od.length > 0) {

                this.fetch({
                    data: JSON.stringify(request),
                    type: 'POST',
                    contentType: 'application/json',
                    timeout: 5000,
                    success: function (response) {
                        flights.vent.trigger('routeHappyCollection.fetchRouteHappy.success', response);
                        return response;
                    },
                    error: function (collection, response, options) {
                      errorHandler(options);
                    }
                });
            }
        },
        getRequest: getRequest,
        getCabinClass: getCabinClass
    });

    function parseOfferData(offerInfo) {
        var offerData = {
            id: offerInfo.id,
            legs: new Backbone.Collection()
        };

        if(!offerInfo.overviewList) {
            return;
        }

        _.each(offerInfo.overviewList.overview, function (rating) {
            if(rating.name !== 'SCORE') { return; }

            offerData.rating = {
                score: rating.value,
                description: rating.description
            };
        });

        _.each(offerInfo.legContentList.legContent, function (legInfo) {
            offerData.legs.push(parseLegData(legInfo));
        });

        return offerData;
    }

    function parseLegData(legInfo) {
        var legData = {
            id: legInfo.id
        };

        _.each(legInfo.overviewList.overview, function (rating) {
            if(rating.name !== 'SCORE') { return; }

            legData.rating = {
                score: rating.value,
                description: rating.description
            };
        });

        legData.amenities = parseLegAmenities(legInfo);
        return legData;
    }

    function parseLegAmenities(legInfo) {
        var segmentContent = legInfo.segmentContentList.segmentContent,
            amenities = {
                entertainmentCount : 0,
                wifiCount : 0,
                powerCount : 0,
                segmentCount : 0
            };

        _.each(segmentContent, function (segment) {
            amenities.segmentCount += 1;

            _.each(segment.amenityList.amenity, function (amenity) {
                if (!amenity.availability) {
                    return;
                }

                switch (amenity.name) {
                    case 'ENTERTAINMENT':
                        amenities.entertainmentCount += 1;
                        break;
                    case 'WIFI':
                        amenities.wifiCount += 1;
                        break;
                    case 'POWER':
                        amenities.powerCount += 1;
                        break;
                    default:
                        break;
                }
            });
        });

        return amenities;
    }

    function getRequest() {
        var modules = flights.collections.legsCollection.models[0].attributes,
            timeLineIndex = 0,
            request = {},
            airTravelerCategoryAdultObj = {},
            airTravelerCategoryChildObj = {},
            odListObj = {},
            tempOD = {},
            cabin,
            ctpObject = [],
            ctp = {},
            segment = {},
            clubbedOffers = {},
            travelDate,
            travelDateSplit,
            self = this;

        clubbedOffers = uiModel.viewableOffers.models;

        request.messageInfo = {};
        request.experimentInfo = {};
        request.messageInfo.tpid = sitebrand.tpid;
        request.messageInfo.eapid = sitebrand.eapid;
        request.messageInfo.tuid = -1;
        request.experimentInfo.id = null;
        request.experimentInfo.groupId = null;
        request.experimentInfo.value = null;
        request.richInfoList = {};
        request.richInfoList.richInfo = [];

        odListObj.id = "1";

        odListObj.searchContext = {};

        if(clubbedOffers.length > 0 && clubbedOffers[0].attributes !== 'undefined'
            && clubbedOffers[0].attributes.legIds !== 'undefined' && clubbedOffers[0].attributes.legIds.length > 1)
            odListObj.searchContext.tripGeometry = "ROUNDTRIP";
        else
            odListObj.searchContext.tripGeometry = "ONEWAY";

        odListObj.searchContext.flightCriteria = {};
        odListObj.searchContext.flightCriteria.airTravelerCategoryList = {};
        odListObj.searchContext.flightCriteria.airTravelerCategoryList.airTravelerCategory = [];

        airTravelerCategoryAdultObj.airTravelerCategoryCode = "adult";
        airTravelerCategoryAdultObj.airTravelerCategoryCount = flights.Wizard.searchParameters.adultTraveler;
        airTravelerCategoryChildObj.airTravelerCategoryCode = "child";
        airTravelerCategoryChildObj.airTravelerCategoryCount = flights.Wizard.searchParameters.childTraveler;

        odListObj.searchContext.flightCriteria.airTravelerCategoryList.airTravelerCategory.push(airTravelerCategoryAdultObj);
        odListObj.searchContext.flightCriteria.airTravelerCategoryList.airTravelerCategory.push(airTravelerCategoryChildObj);

        odListObj.odlist = {};
        odListObj.odlist.od = [];

        _.each(clubbedOffers, function (singleOffer) {
            var attributes = singleOffer.attributes,
                id1 = attributes.legIds[0],
                id2 = attributes.legIds[1];

            if(true === singleOffer.get('bargainOffer')) {
                return; //continue
            }

            tempOD = {};
            ctp = {};
            tempOD.id = attributes.naturalKey;
            tempOD.legList = {};
            tempOD.legList.leg = [];

            _.each(modules, function (module) {
                if (module.naturalKey === id1 || module.naturalKey === id2) {
                    var leg = {};
                    if (module.naturalKey === id1) {
                        leg.id = id1;
                    } else {
                        leg.id = id2;
                    }
                    leg.airFareCategoryCode = module.price.flightFareTypeCode;
                    leg.airProviderCode = module.carrierSummary.airProviderId;

                    ctp.id = leg.id;
                    ctp.isClickToPrice = !attributes.price.hasFare;

                    leg.segmentList = {};
                    leg.segmentList.segment = [];
                    _.each(module.timeline, function (segmentInfo) {
                        travelDate = undefined;
                        travelDateSplit = undefined;
                        if (segmentInfo.segment) {
                            segment = {};
                            travelDate = segmentInfo.departureTime.travelDate;
                            if (typeof travelDate === 'string' && travelDate.indexOf('/') > -1) {
                                travelDateSplit = travelDate.split('/');
                                travelDate = (parseInt(travelDateSplit[2],10) + 2000).toString() + '-' + travelDateSplit[0] + '-' + travelDateSplit[1];
                            }
                            segment.id = '' + timeLineIndex;
                            segment.carrierCode = segmentInfo.carrier.airlineCode;
                            segment.operatingCarrierCode = ((segmentInfo.carrier.operatedByAirlineCode !== "") ? segmentInfo.carrier.operatedByAirlineCode : segmentInfo.carrier.airlineCode);
                            segment.flightNumber = segmentInfo.carrier.flightNumber;
                            segment.bookingCode = $.trim(segmentInfo.carrier.bookingCode);
                            segment.flightCriteria = {};
                            segment.flightCriteria.origin = segmentInfo.departureAirport.code;
                            segment.flightCriteria.destination = segmentInfo.arrivalAirport.code;
                            segment.flightCriteria.date = travelDate;
                            cabin = segmentInfo.carrier.cabinClass;
                            segment.flightCriteria.cabinClass = getCabinClass(cabin);
                            leg.segmentList.segment.push(segment);
                            timeLineIndex = timeLineIndex + 2;
                        }
                    });
                    tempOD.legList.leg.push(leg);
                    timeLineIndex = 0;
                }
            });
            odListObj.odlist.od.push(tempOD);
            ctpObject[tempOD.id] = ctp;
        });


        request.richInfoList.richInfo.push(odListObj);
        var richContentRequest = {};
        richContentRequest.requestObject = request;
        richContentRequest.ctpObject = ctpObject;

        return richContentRequest;
    }

    function getCabinClass(cabin) {
        var cabinClassType = {
            '1': 'FIRST',
            '2': 'BUSINESS',
            '3': 'ECONOMY',
            '5': 'PREMIUM_COACH'
        };

        if (undefined === cabinClassType[cabin]) {
            return 'COACH';
        }
        return cabinClassType[cabin];
    }

    return CollectionConstructor;
});
/* static_content/default/default/scripts/exp/flights/flux/collections/legsCollection.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('legsCollection', ['flights', 'legModel', 'backbone', 'underscore'], function(flights, LegModel, Backbone, _) {

    'use strict';

    var selectedLegIds = {};

    function markLegsAsSelected(selectedLegIds, allLegsMap){
        _.each(selectedLegIds, function(naturalKey){
            var legModel = allLegsMap.get(naturalKey);
            if(undefined !== legModel){
                legModel.isSelected = true;
            }
        });
    }

    return Backbone.Collection.extend({
        model: LegModel,
        initialize: function() {

            var self = this;

            self.listenTo(this, 'change', function() {
                markLegsAsSelected(selectedLegIds, this.models[0]);
            });
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/collections/offersCollection.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('offersCollection', ['offerModel', 'backbone'], function(OfferModel, Backbone) {
    'use strict';
     return Backbone.Collection.extend({
            model: OfferModel
     });
});

/* static_content/default/default/scripts/exp/flights/flux/collections/AirlineFiltersCollection.js */
/*jslint browser: true, unparam: false, white: true, todo: true */
/*global define, require, console */

define('airlineFiltersCollection', ['airlineFiltersModel', 'backbone'], function(AirlineFiltersModel, Backbone) {
    'use strict';
	return Backbone.Collection.extend({
        model: AirlineFiltersModel
    });
});
/* static_content/default/default/scripts/exp/flights/flux/collections/AirportFiltersCollection.js */
/*jslint browser: true, unparam: false, white: true, todo: true, nomen: true */
/*global define, require, console */

define('airportFiltersCollection', ['airportFilterModel', 'backbone'], function(AirportFilterModel, Backbone) {
   'use strict';
    return Backbone.Collection.extend({
        model: AirportFilterModel
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/LegModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('legModel', ['flights', 'backbone'], function(flights, Backbone) {
    'use strict';
	return Backbone.Model.extend({});
});
/* static_content/default/default/scripts/exp/flights/flux/models/OfferModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('offerModel', ['flights', 'backbone'], function(flights, Backbone) {
    'use strict';
    return Backbone.Model.extend({});
});
/* static_content/default/default/scripts/exp/flights/flux/models/PaginationModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('paginationModel'
    , ['flights', 'configuration', 'backbone', 'i18n']
    , function(flights, configuration, Backbone, i18n) {
        'use strict';

        return Backbone.Model.extend({

            defaults : {
                topLink : true,
                totalNumberOfResults : 100,
                currentFirstResult : 1,
                currentPageNumber : 1,
                numberOfResultsPerPage : configuration.pagination.numOffersPerPage,
                messageTemplate: i18n.paging.accessibility.searchingForPage,
                name: 'Pagination'
            }
        });
    });

/* static_content/default/default/scripts/exp/flights/flux/models/SinglePageModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('singlePageModel', ['backbone','jquery'], function(Backbone, $) {
    'use strict';

    return Backbone.Model.extend({
        initialize: function () {
            this.set(JSON.parse($('#singlePageModel').html()));
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/AjaxErrorModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('ajaxErrorModel'
    , ['flights', 'backbone']
    , function(flights, Backbone) {
        'use strict';

        var model = Backbone.Model.extend({
            defaults: {
                options: {}
            },

            ERROR_CODES: {
                NO_FLIGHTS_FOUND: 'NFF',
                TIMEOUT: 'timeout',
                UNKNOWN_ERROR: 'ERR',
                MIS_ERROR: 'MIS ERR'
            },

            FAILING_PRODUCT: {
                12940: 'flight',
                13365: 'hotel',
                13497: 'car'
            },

            resetToDefaults: function(){
                this.clear({silent: true}).set(this.defaults);
            }
        });

        return new model();

    });
/* static_content/default/default/scripts/exp/flights/flux/models/CacheModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('cacheModel', ['flights', 'backbone'], function(flights, Backbone) {
    'use strict';

    return Backbone.Model.extend({

        cache : {},

        putEntry: function(key, value) {
            this.cache[key] = value;
        },

        getCachedEntry: function(key) {
            return this.cache[key];
        },

        containsEntry: function(key) {
            return this.cache[key] !== undefined;
        }


    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/FiltersModel.js */
/*jslint nomen:true */
/*global define, require, console */

define('filtersModel', ['backbone', 'underscore'], function (Backbone, _) {
    'use strict';

    function mapStopFilterToCode(filterName) {
        return {
            'nonstop': '0',
            '1stop': '1',
            '2stop': '2'
        }[filterName];
    }

    function mapTimeFilterToCode(filterName) {
        return {
            'EARLYMORNING': 'em',
            'MORNING': 'm',
            'AFTERNOON': 'a',
            'EVENING': 'e'
        }[filterName];
    }

    function retrieveUnnestedFilters(options) {
        return _.chain(options.filterSet)
            .where({checked: true})
            .pluck(options.pluckValue)
            .map(options.mapFunction)
            .value()
            .join(',');
    }

    function retrieveNestedFilters(options) {
        var activeFilters = {};
        _.each(options.filterSet, function (filterSet, index) {
            activeFilters[options.filterKey + index] = retrieveUnnestedFilters(_.extend(options, {filterSet: filterSet}));
        });
        return activeFilters;
    }

    return Backbone.Model.extend({

        retrieveActiveFilters: function () {
            var activeFilterSummary,
                activeAirlineFilters,
                activeStopFilters,
                activeAirportFilters,
                activeTimeFilters = {};

            activeAirlineFilters = retrieveUnnestedFilters({
                filterSet: this.get('airlineFilters'),
                pluckValue: 'airlineCode',
                mapFunction: function (filter) { return filter; }
            });

            activeStopFilters = retrieveUnnestedFilters({
                filterSet: this.get('stopFilters'),
                pluckValue: 'filterName',
                mapFunction: mapStopFilterToCode
            });

            activeAirportFilters = retrieveNestedFilters({
                filterSet: this.get('arrivalAirportFilters'),
                filterKey: 'fad',
                pluckValue: 'airportCode',
                mapFunction: function (filter) { return filter; }
            });

            _.extend(activeTimeFilters, retrieveNestedFilters({
                filterSet: this.get('arrivalTimeFilters'),
                filterKey: 'fr',
                pluckValue: 'filterName',
                mapFunction: mapTimeFilterToCode
            }));

            _.extend(activeTimeFilters, retrieveNestedFilters({
                filterSet: this.get('departureTimeFilters'),
                filterKey: 'fd',
                pluckValue: 'filterName',
                mapFunction: mapTimeFilterToCode
            }));

            activeFilterSummary = {
                fa: activeAirlineFilters,
                fs: activeStopFilters
            };

            _.extend(activeFilterSummary, activeAirportFilters);
            _.extend(activeFilterSummary, activeTimeFilters);
            _.extend(activeFilterSummary, this.get('legFilters'));

            return _.omit(activeFilterSummary, function (value) {
                return value === '';
            });
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/StopFiltersModel.js */
/*jslint browser: true, unparam: false, white: true, todo: true */
/*global define, require, console */

define('stopFiltersModel', ['backbone'], function(Backbone) {
    'use strict';
	return Backbone.Model.extend({
            defaults: {
                '0': {
                    count: 0,
                    enabled: false,
                    price: {
                        amount: 0,
                        formatted: ''
                    }
                },
                '1': {
                    count: 0,
                    enabled: false,
                    price: {
                        amount: 0,
                        formatted: ''
                    }
                },
                '2': {
                    count: 0,
                    enabled: false,
                    price: {
                        amount: 0,
                        formatted: ''
                    }
                }
            }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/AirlineFiltersModel.js */
/*jslint browser: true, unparam: false, white: true, todo: true */
/*global define, require, Backbone, console */

define('airlineFiltersModel', ['backbone'], function(Backbone) {
    'use strict';
	return Backbone.Model.extend({});
});
/* static_content/default/default/scripts/exp/flights/flux/models/AirportFiltersModel.js */
/*jslint browser: true, unparam: false, white: true, todo: true, nomen: true */
/*global define, require, console */

define('airportFilterModel', ['backbone'], function (Backbone) {
    return Backbone.Model.extend({});
});
/* static_content/default/default/scripts/exp/flights/flux/models/FilterItemModel.js */
/*jslint browser: true, unparam: false, white: true, todo: true */
/*global define, require, console */

define('filterItemModel', ['backbone'], function(Backbone) {
    'use strict';
	return Backbone.Model.extend({});
});
/* static_content/default/default/scripts/exp/flights/flux/models/SortBarModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('sortBarModel', ['i18n', 'backbone', 'configuration'], function(i18n, Backbone, configuration) {
    'use strict';

    return Backbone.Model.extend({

        retrieveActiveSort: function () {
            return {
                type: this.get('type'),
                direction: this.get('direction')
            };
        },

        defaults : {
            interstitialMessage: i18n.sorting.interstitial.generic, //TODO: Remove this from SortBarModel (Sort Bar is distinct entity)
            type: (configuration.loyalty.partnerPointsEnabled) ? 'so' : 'sp',
            direction: 'asc'
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/ApplicationView.Logging.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen:true */
/*global define, require, console  */

define('applicationViewLogging', ['flights','dctk/dctk'], function (flights, dctk) {
    'use strict';
    var logging = {
        lastRetrievedOmnitureData: null,
        getNavStartTime: function() {
            var navStart;

            if (window.performance && window.performance.timing) {
                // Use HTML5's navigation API to get timing from kick-off click.
                navStart = window.performance.timing.navigationStart;

            } else if (dctk.logging.pageStartTime) {
                // If HTML5 navigation API unavailable, use less accurate DCTK method.
                navStart = dctk.logging.pageStartTime;
            }

            return navStart;
        },
        getNowTime: function() {
            return new Date().getTime();
        },
        logEvent: function(eventName, startTime, endTime) {
            dctk.logging.logTrxEvent('flightSearch', ['clEventName01=' + eventName, 'clEventTime01=' + (endTime - startTime)]);
        },
        logEventForAjax: function(eventName, relativeUrl, startTimeMs, stopTimeMs) {
            var performance, name;

            if(window.performance && 'function' === typeof(window.performance.getEntriesByName)) {
                name = window.location.protocol + '//' + window.location.host + relativeUrl;
                performance = window.performance.getEntriesByName(name);

                if(performance.length
                    && performance[0].startTime
                    && performance[0].responseEnd) {
                    startTimeMs = performance[0].startTime;
                    stopTimeMs = performance[0].responseEnd;
                }
            }
            this.logEvent(eventName, startTimeMs, stopTimeMs);
        },
        generateListingOmnitureString: function(offer) {
            var omnitureString = '';

            omnitureString += (offer.splitTicket ? 'Y' : 'N') + '|';
            omnitureString += (offer.bargainOffer ? 'Y' : 'N') + '|';
            omnitureString += (offer.price.flightFareTypeCode + '-' + offer.price.flightFareTypeValue + '|');
            omnitureString += (offer.legs[0].stops + '|');
            omnitureString += (offer.bestValue ? 'bestValue' : (offer.cheapest ? 'cheapest' : (offer.shortest ? 'shortest' : '')));

            return omnitureString;
        },

        logPerformanceModelResults: function(response, options){

            var entries,
                omnitureData,
                isInitialSearch,
                dctkLogArray = [],
                cleanList,
                performanceModel;

            if(undefined === response
                || undefined === response.metaData
                || undefined === response.metaData.map) {
                flights.log('`response` is undefined.');
                return;
            }

            performanceModel = response.metaData.map.performanceModel;

            if (undefined === performanceModel || null === performanceModel) {
                flights.log('`response` is invalid: `performanceModel` is undefined.');
                return;
            }

            if (undefined === response.content || null === response.content.omniture) {
                flights.log('`response` is invalid: property `content` is undefined or `omniture` is null.');
                return;
            }

            if(undefined === options) {
                flights.log('`options` is undefined.');
                return;
            }

            entries = performanceModel.entries;
            omnitureData = response.content.omniture.json;
            isInitialSearch = options.data.is;

            if(omnitureData != ''){
                omnitureData = JSON.parse(omnitureData);
                this.lastRetrievedOmnitureData = omnitureData;
            } else {
                omnitureData = this.lastRetrievedOmnitureData;
            }

            dctkLogArray.push('totalTime='+ performanceModel.totalTime);
            dctkLogArray.push('tag=' + performanceModel.tag);
            dctkLogArray = logging.buildPerfEventLogArray(entries, dctkLogArray);

            cleanList = logging.formatAbacusList(omnitureData);
            dctkLogArray.push('abacusBuckets=' + cleanList);
            dctkLogArray.push('isInitialSearch=' + (isInitialSearch === 1));

            addCalculatedGulfstreamEntries(dctkLogArray, entries, performanceModel.totalTime);
            dctkLogArray.push('staticPage=false');

            dctk.logging.logTrxEvent('performanceMetrics', dctkLogArray);
        },


        buildPerfEventLogArray: function(entries, initArray) {
            var logArray = initArray || [];
            for(var i = 0; i < entries.length; i++){
                logArray.push(entries[i].name + '=' + entries[i].value);
            }
            return logArray;
        },


        formatAbacusList: function(omnitureData) {
            if( omnitureData === null ) {
                return null;
            }
            return omnitureData.omnitureProperties.list1.replace(/\|/g, ':');
        }
    };

    function addCalculatedGulfstreamEntries(logArray, entries, totalTime) {
        var fromCache = true, gulfstreamTime = 0;

        if (entries !== undefined && entries.length > 0) {

            for (var index = 0; index < entries.length; index++) {
                if (entries[index].name.indexOf("GulfstreamRequest") > -1) {
                    fromCache = false;
                    gulfstreamTime = entries[index].value;
                }
            }

            logArray.push('resultsFromCache=' + fromCache);

            if (gulfstreamTime > 0 && totalTime > gulfstreamTime) {
                logArray.push('totalNonGSTime=' + (totalTime - gulfstreamTime));
            }
        }
    }

    return logging;
});

/* static_content/default/default/scripts/exp/flights/flux/views/ApplicationView.js */
/*jslint browser: true, unparam: true, todo: true, nomen:true */
/*global define, require, console, JSON  */

define('applicationView',
    [
        'backbone',
        'marionette',
        'underscore',
        'flights',
        'jquery',
        'uitk',
        'dctk/dctk',
        'applicationViewLogging',
        'legsCollection',
        'singlePageModel',
        'filtersView',
        'filtersModel',
        'paginationView',
        'paginationModel',
        'ajaxErrorView',
        'sortBarView',
        'sortBarModel',
        'staleDataModalView',
        'feedback',
        'analytics',
        'xSellBannerView',
        'scratchpadModal',
        'cacheModel',
        'i18n',
        'configuration',
        'airAttachModel',
        'crossSellModel',
        'universalDataObjectAjaxUtils',
        'flightDeltaView',
        'progress',
        'priceAlert',
        'cachedOfferListView',
        'experiments',
        'liveAnnounceDispatcher',
        'wizardView',
        'wizardModel',
        'uiModel',
        'offersCollectionView',
        'pageCriteriaController',
        'pageNameTracker',
        'mixedCabinClassMessageView',
        'sitebrand'
    ], function (Backbone,
                 Marionette,
                 _,
                 flights,
                 $,
                 uitk,
                 dctk,
                 logging,
                 LegsCollection,
                 SinglePageModel,
                 FiltersView,
                 FiltersModel,
                 PaginationView,
                 PaginationModel,
                 AjaxErrorView,
                 SortBarView,
                 SortBarModel,
                 StaleDataModalView,
                 feedback,
                 analytics,
                 XSellBannerView,
                 ScratchpadModal,
                 CacheModel,
                 i18n,
                 Configuration,
                 AirAttachModel,
                 CrossSellModel,
                 universalDataObjectAjaxUtils,
                 FlightDeltaView,
                 progress,
                 priceAlert,
                 cachedOfferListView,
                 experiments,
                 liveAnnounceDispatcher,
                 WizardView,
                 WizardModel,
                 uiModel,
                 OffersCollectionView,
                 PageCriteriaController,
                 pageNameTracker,
                 MixedCabinClassMessageView,
                 sitebrand
        ) {

        'use strict';

        return Backbone.View.extend({
            model : uiModel,
            singlePageModel: new SinglePageModel(),

            fetchTimeout: 30,

            interstitial: {
                $acol: $('#acol-interstitial'),
                $outboundSpinner: $('#outboundSpinner'),
                $pi: $('#pi-interstitial')

            },

            fetchOrigin: 'InitialSearch',

            disableFormControls: function () {
                this._setFormControlState('disable');
            },

            enableFormControls: function () {
                this._setFormControlState('enable');
            },

            _setFormControlState: function (enableOrDisable) {
                var components = [
                    this.sortBarView,
                    this.paginationView,
                    this.filtersView
                ];

                // foreach view, call enable or disable
                $.each(components, function (i, view) {
                    if (view !== undefined && typeof view[enableOrDisable] === 'function') {
                        view[enableOrDisable]();
                    }
                });
            },

            fetchCached: function (options) {
                var self = this,
                    offers,
                    isPriceChanged = self.singlePageModel.get('isPriceChanged'),
                    emailTime = self.singlePageModel.get('emailTime'),
                    emailPrice = self.singlePageModel.get('emailPrice'),
                    successCheckPointInMS = logging.getNowTime(),
                    cachedResultsJSON,
                    cacheResults,
                    cachedContentModel,
                    isExactMatch;

                self.disableFormControls();

                cachedResultsJSON = $('#cachedResultsJson').html();

                if (cachedResultsJSON === '') {
                    analytics.updateOmnitureProperty('prop63', 'FLT.SR.Cache.Miss');
                    logJsonCacheResult(false, self.singlePageModel, self.wizardView.model);
                } else {
                    self.interstitial.$outboundSpinner.hide();

                    cacheResults = JSON.parse(cachedResultsJSON);

                    cachedContentModel = self.helpers.extractContent(cacheResults);
                    self.helpers.updateLegsCollection(cachedContentModel.legs);
                    if(experiments.getVariant(13347) !== 2) {
                        self.helpers.updateFilters(self.filtersView, cachedContentModel.summary);
                    }
                    experiments.execute('FILTERS_EXPERIMENTS', {
                        legs: cachedContentModel.legs,
                        offers: cachedContentModel.offers
                    });

                    // BUG: The content title should not be hard coded
                    isExactMatch = ('siteid-locale-dlc-rlc-dd-rd' === cacheResults.metaData.map.contentTitle);
                    logJsonCacheResult(isExactMatch, self.singlePageModel, self.wizardView.model);

                    if (Configuration.perceivedInstantEnabled && true === isExactMatch) {
                        uiModel.addCacheInfo(cachedContentModel, {
                            isCached: true,
                            freshness: cacheResults.metaData.map.timeStampMs
                        });

                        uiModel.loadContentModel(cachedContentModel);

                        uitk.utils.liveAnnounce(i18n.sorting.accessibility.sortedByPrice);
                        uiModel.setCacheType('Cache.ExactMatch');

                        if (!Configuration.shouldRenderCachedOffersServerSide && dctk && dctk.ewePerformance) {
                            dctk.ewePerformance.mark('renderCachedOffers');
                            dctk.ewePerformance.markPageUsable();
                        }
                        
                        experiments.execute('FSR_CachedListings_InfoCombos');
                    } else {
                        offers = self.helpers.getProcessedOffers(cachedContentModel.index, cachedContentModel.offers, cacheResults.metaData.map.timeStampMs, undefined, undefined, cachedContentModel.partnerLoyaltyDataMap);

                        cachedOfferListView.setOffers({offers: offers});

                        //Abacus experiment: CSFSRSabrePriceAccuracy, ID:8208
                        if (isPriceChanged === 'true' && emailTime !== '' && emailPrice !== '') {
                            self.helpers.updateTimeAndPriceDiffToOmnitureProperty(self.flightDeltaView.getCheapestPriceOfCurrentSearch(cachedContentModel),
                                emailTime, emailPrice);
                        }
                    }

                    flights.vent.trigger('applicationView.cachedResultsComplete', cachedContentModel);
                    logging.logEvent('FLUX_TimeToDisplayCachedResults', logging.getNavStartTime(), logging.getNowTime());
                    logging.logEvent('FLUX_CachedResultsRenderedDuration', successCheckPointInMS, logging.getNowTime());

                    if (options && options.callbacks && typeof options.callbacks.success === 'function') {
                        options.callbacks.success(self);
                    }
                }
                if (options && options.callbacks && typeof options.callbacks.complete === 'function') {
                    options.callbacks.complete(self);
                }

                experiments.execute('FSR_Redesigned_Filters_Update_For_v2', {
                    appView: self,
                    cachedContent: cachedContentModel
                });

                experiments.execute('Delayed_Wizard_Experiments', self.wizardView);
            },

            helpers: {

                getProcessedOffers: function (indexes, offers, freshnessTime, resultToken, multiItemDetails, partnerLoyaltyDataMap) {
                    var offerIndex = 0,
                        firstNonEbf = true,
                        processedOffers = [],
                        self = this;
                    $.each(indexes, function (i, naturalOfferKey) {
                        var offer = offers[naturalOfferKey];
                        offer.index = offerIndex;
                        offerIndex += 1;
                        offer.freshnessTime = freshnessTime;
                        offer.resultNumber = offerIndex;
                        offer.firstNonEbf = firstNonEbf && !offer.bargainOffer;
                        if (offer.firstNonEbf) {
                            firstNonEbf = false;
                        }
                        if (offer.packageable && multiItemDetails) {
                            offer = self.setPackagedAnchorPrice(offer, multiItemDetails.perPersonPrice);
                        }
                        offer.resultToken = resultToken;
                        if (partnerLoyaltyDataMap && partnerLoyaltyDataMap[naturalOfferKey]) {
                            offer.partnerLoyaltyValue = partnerLoyaltyDataMap[naturalOfferKey][0];
                        }
                        processedOffers.push(offer);
                    });
                    return processedOffers;
                },

                setPackagedAnchorPrice: function (offer, anchorPrice) {
                    var modifiedOffer = offer;
                    modifiedOffer.price.anchoredPrice = anchorPrice;
                    return modifiedOffer;
                },

                updateLegsCollection: function (legs) {
                    flights.collections.legsCollection.set(legs);
                    flights.collections.legsCollection.trigger('change');
                },

                updateTimeAndPriceDiffToOmnitureProperty: function (cheapestPriceAmount, emailTime, emailPrice) {
                    var priceDiff = emailPrice - Math.round(cheapestPriceAmount),
                        fsrLoadTime = new Date().getTime(),
                        timeDiff = parseInt((fsrLoadTime - emailTime) / 60000, 10),
                        omnitureStr = timeDiff + '|' + priceDiff;
                    analytics.updateOmnitureProperty('prop62', omnitureStr);
                },

                updateFilters: function (filtersView, summary) {
                    if ('object' === typeof summary && 'object' === typeof summary.filters && Configuration.filters.enabled) {
                        filtersView.model.set(summary.filters);
                    }
                },

                extractContent: function (cache) {
                    if (undefined === cache.content) {
                        return cache;
                    }
                    this.updateOmnitureWithCacheType(cache.metaData);
                    return JSON.parse(cache.content);
                },

                updateOmnitureWithCacheType: function (metaData) {
                    var hitTypeMap = {
                            'siteid-locale-dlc-rlc-ddw-rdw':        'FLT.SR.Cache.PartialMatch.ODDepartureAndReturnDay',
                            'siteid-locale-dlc-rlc-ddw':            'FLT.SR.Cache.PartialMatch.ODDepartureDay',
                            'siteid-locale-dlc-rlc':                'FLT.SR.Cache.PartialMatch.ODOnly',
                            'siteid-locale-dlc-alc-ddw':            'FLT.SR.Cache.PartialMatch.ODDepartureDay',
                            'siteid-locale-dlc-alc':                'FLT.SR.Cache.PartialMatch.ODOnly',
                            'siteid-locale-dlc-rlc-dd-rd':          'FLT.SR.Cache.ExactMatch'
                        },
                        map,
                        contentTitle,
                        cacheType = 'FLT.SR.Cache.Unknown';

                    if (metaData !== undefined || metaData !== null) {
                        map = metaData.map;
                        contentTitle = map.contentTitle;

                        if (undefined !== hitTypeMap[contentTitle]) {
                            cacheType = hitTypeMap[contentTitle];
                        }

                        analytics.updateOmnitureProperty('prop63', cacheType);
                    }
                }
            },

            initializeRouteHappy: function() {
                var self = this;

                require(['routeHappyView','routeHappyCollection','seatAmenitiesView'], function (RouteHappyView, RouteHappyCollection, SeatAmenitiesView) {

                    self.routeHappyCollection = new RouteHappyCollection();

                    self.routeHappyView = new RouteHappyView({
                        renderOnEachUpdate: true,
                        useLegLevelInfo: true === Configuration.route.isRoundTrip,
                        getOfferElement: function (offerId) {
                            return self.offersCollectionView.getOfferElement(offerId);
                        }
                    });

                    if (Configuration.route.isRoundTrip || Configuration.route.isOneWay) {
                        self.seatAmenitiesView = new SeatAmenitiesView({
                            getOfferElement: function (offerId) {
                                return self.offersCollectionView.getOfferElement(offerId);
                            }
                        });
                    }

                    flights.vent.on('uiModel.resetViewableOffers', function(options) {
                        flights.vent.once('routeHappyCollection.fetchRouteHappy.success', function(response) {
                            self.routeHappyView.renderRouteHappyInfo(options, response);

                            if (self.seatAmenitiesView) {
                                self.seatAmenitiesView.render(response);
                            }
                        });

                        self.routeHappyCollection.fetchRouteHappy();
                    });
                });
            },

            initializeFilters: function () {
                var self = this;

                self.filtersModel = new FiltersModel();

                if (Configuration.filters.enabled) {
                    self.filtersView = new FiltersView({
                        appView: self,
                        singlePageModel: self.singlePageModel,
                        filtersModel: self.filtersModel,
                        shouldSaveCheckedState: !Configuration.view.isByot
                    });
                }
            },

            createChildViews: function () {
                var self = this,
                    wizardData = $.parseJSON($('#wizardData').html()),
                    isDelayRenderExperiment = (experiments.getVariant(13634) === 1),
                    isDisabledWizardExperiment = (experiments.getVariant(13633) >= 1);

                self.wizardView = new WizardView({
                    model: new WizardModel(wizardData),
                    routeTypeSwitch: {
                        enabled: !Configuration.isFCShoppingMode,
                        showOneway: true,
                        showRoundtrip: true,
                        showMultiDest: Configuration.wizard.showMultiDestRadioButton
                    },
                    showNearbyAirports: !Configuration.isFCShoppingMode && Configuration.wizard.showGDSFlightExtraOptions && Configuration.wizard.airAsiaGDS,
                    showRefundable: !Configuration.isFCShoppingMode,
                    showAdditionalOptions: Configuration.wizard.showAdditionalOptions,
                    showToggleSummaryAdditionalOptions: Configuration.wizard.showGDSFlightExtraOptions,
                    airportsDropDown: {
                        enabled: !Configuration.wizard.airAsiaGDS,
                        options: window.dropDownJSON
                    },
                    showNonstop: true,
                    showPreferredAirlines: true,
                    showPreferredCabinClass: true,
                    airportFieldClearButtonEnabled: true,
                    showWizardForPackages: Configuration.isFCShoppingMode,
                    renderOnInit: !isDisabledWizardExperiment && !isDelayRenderExperiment
                });

                self.ajaxErrorView = new AjaxErrorView({
                    appView: self
                });

                self.sortBarModel = new SortBarModel();

                self.sortBarView = new SortBarView({
                    appView: self,
                    model: self.sortBarModel
                });

                self.paginationModel = new PaginationModel();

                self.paginationView = new PaginationView({
                    appView: self,
                    model: self.paginationModel
                });

                experiments.execute('FSR_Redesigned_Filters', self);

                self.initializeFilters();

                experiments.execute('FSR_Mobile_FilterFlyOut', {viewDependencies: {
                    appView: self,
                    singlePageModel: self.singlePageModel,
                    filtersModel: self.filtersModel,
                    shouldSaveCheckedState: !Configuration.view.isByot
                }});

                self.pageCriteriaController = new PageCriteriaController({
                    filtersModel: self.filtersModel,
                    sortModel: self.sortBarModel,
                    paginationModel: self.paginationModel,
                    routerEnabled: Configuration.view.isByot
                });

                if (Configuration.loyalty.partnerPointsEnabled && Configuration.loyalty.displayPointsMessaging) {
                    require(['partnerLoyaltyMessagingView'], function (PartnerLoyaltyMessagingView) {
                        self.partnerLoyaltyMessagingView = new PartnerLoyaltyMessagingView();
                    });
                }

                self.flightDeltaView = new FlightDeltaView();

                if (true === Configuration.view.isByot) {
                    require(['setupRouter', 'selectedDepartureModel', 'selectedDepartureView', 'PageTitleModel', 'PageTitleView'],
                        function (setupRouter, SelectedDepartureModel, SelectedDepartureView, PageTitleModel, PageTitleView) {
                            var router = setupRouter();

                            // On Flexible Shopping /packages path, we don't want to show selected Departure view
                            if (!Configuration.isFlexibleShoppingEnabled) {
                                self.selectedDepartureView = new SelectedDepartureView({
                                    model: new SelectedDepartureModel(),
                                    router: router
                                });
                            }

                            self.pageTitleView = new PageTitleView({
                                model: new PageTitleModel({
                                    useChangeMessaging: Configuration.userSelectsChangeFlight
                                })
                            });
                        });
                }

                self.mixedCabinClassMessageView = new MixedCabinClassMessageView({
                    selectedCabin: parseInt(wizardData.travelerPreferences.seatingClass, 10),
                    cabinClassList: wizardData.travelerPreferences.seatingClassList
                });

                if (Configuration.loyalty.partnerPointsEnabled && Configuration.loyalty.partnerPointsToggle) {
                    require(['partnerLoyaltyToggleModel', 'partnerLoyaltyToggleView'],
                        function (PartnerLoyaltyToggleModel, PartnerLoyaltyToggleView) {
                            self.partnerLoyaltyToggleView = new PartnerLoyaltyToggleView({
                                model: new PartnerLoyaltyToggleModel()
                            });
                        });
                }

                if (Configuration.priceTrends.enabled) {
                    require(['priceTrendsView'], function (PriceTrendsView) {
                        self.priceTrendsView = new PriceTrendsView();
                    });
                }
            },

            setupCrossSellModels: function () {
                var self = this;

                self.crossSellModel = new CrossSellModel();
                self.airAttachModel = new AirAttachModel({
                    singlePageModel: self.singlePageModel,
                    crossSellModel: self.crossSellModel
                });
            },

            setupPageNameTracker: function (configuration, flights, uiModel) {
                pageNameTracker.trackPageName(flights, uiModel);

                if (true === Configuration.view.isByot) {
                    pageNameTracker.trackByotPageName(flights, uiModel);
                }
            },

            updateOmniture: function (options) {
                if ('ACCEPT' === options.omniture.status) {
                    analytics.updateOmnitureData($.parseJSON(options.omniture.json));
                }
                analytics.updateOmnitureProperty('prop52', logging.generateListingOmnitureString(options.offer));

                if (options.offer.discount > 0) {
                    analytics.updateOmnitureProperty('events', 'event12,event54,event203');
                } else {
                    analytics.updateOmnitureProperty('events', 'event12,event54');
                }
            },

            setupCrossSellForLiveOffers: function (crossSellModel, resultsModel) {
                var self = this;

                if (Configuration.xsell.hotel.enabled) {
                    self.xSellBannerView = new XSellBannerView({
                        model: crossSellModel,
                        searchResultsModel: resultsModel,
                        href: Configuration.xsell.hotel.defaultHref,
                        bannerText: Configuration.xsell.hotel.defaultBannerText
                    });
                    if (Configuration.xsell.hotel.livePricing.enabled && self.xSellBannerView.isEnabled()) {
                        self.airAttachModel.getResults(resultsModel);
                    }
                }
            },

            notifyPageModel: function () {
                if (Configuration.isFlightUrgencyEnabled && !Configuration.isMobilePerfComparison) {
                    if (Configuration.isFSREventsEnabled) {
                        experiments.execute('EVENTSONFSR.MODAL', {});
                    } else {
                        var self = this;
                        require(['flightNotifier'], function (flightNotifier) {
                            flightNotifier.notify({
                                dtla: (self.singlePageModel.get('arrivalAirportCode')),
                                clientId: Configuration.isFlexibleShoppingEnabled ?'pkgfsr':'fsr',
                                brandName: sitebrand.brandname
                            });
                        });
                    }
                }
            },

            setupDomRefresh: function (offersCollectionView) {
                var self = this;

                self.listenTo(offersCollectionView, 'dom:refresh', function () {
                    self.enableFormControls();
                });
            },

            fetchLiveOffers: function (options) {
                var self = this,
                    cacheType = uiModel.getCacheType();

                priceAlert.initialize( {
                    departureAirport: self.wizardView.model.attributes.trips.first().get('departure').get('code'),
                    departureDate: self.wizardView.model.attributes.trips.first().get('departure').get('date').get('shortFormat'),
                    arrivalAirport: self.wizardView.model.attributes.trips.first().get('arrival').get('code'),
                    arrivalDate: self.wizardView.model.attributes.trips.first().get('arrival').get('date').get('shortFormat'),
                    dateFormat: flights.Model.Wizard.calendar.dateFormat
                });

                self.setupPageNameTracker(Configuration, flights, uiModel);
                logging.logEvent('FLUX_uiModel_AjaxStartTime', logging.getNavStartTime(), logging.getNowTime());
                experiments.execute('PERCEIVED_INSTANT_ON_RT');
                uiModel.getPage(function (model) {

                    uitk.utils.liveAnnounce(i18n.sorting.accessibility.sortedByPrice);

                    if (false === model.isEmpty()) {
                        self.setupCrossSellForLiveOffers(options.crossSellModel, uiModel);
                    }

                    uitk.publish('Flights.ModuleBuilder.Controller.renderComplete');

                    self.notifyPageModel();

                    flights.vent.trigger('applicationView.initialSearchSuccess', {appView: self});

                    self.staleDataModalView = new StaleDataModalView({model: uiModel});
                    feedback.showLink();

                    if (!Configuration.isMobilePerfComparison) {
                        require(['ads'], function (ads) {
                            ads.show();
                        });
                    }

                    priceAlert.priceChangeAlertReset();

                    if (dctk && dctk.ewePerformance) {
                        dctk.ewePerformance.mark('renderLiveOffers');

                        if (cacheType !== "Cache.ExactMatch") {
                            dctk.ewePerformance.markPageUsable();
                        }
                    }
                    analytics.updateOmnitureProperty('prop1', self.paginationView.model.get('totalNumberOfResults').toString());
                    analytics.trackPageLoad();
                    logging.logEvent('FLUX_uiModel_TotalSearchTime_success',
                            logging.getNavStartTime(), logging.getNowTime());
                });
            },
            makeInitialRequest: function () {
                var self = this;

                if (dctk && dctk.ewePerformance) {
                    dctk.ewePerformance.mark('pageDataRequested');
                }

                if(window.promiseCache) {
                    window.promiseCache.then(function(cacheResults) {
                        $('#originalContinuationId').text(cacheResults.continuousSessionId);
                        $('#cachedResultsJson').text(cacheResults.cachedJson);
                        self.fetchCached({
                            origin: self.fetchOrigin + 'Cached',
                            callbacks: {
                                complete: function () {

                                    if (Configuration.shouldRenderCachedOffersServerSide) {
                                        self.setupInitialOffers();
                                    }


                                    self.sortBarView.enable();


                                    /*self.fetchLiveOffers({
                                        crossSellModel: self.crossSellModel
                                    });*/
                                }
                            }
                        });
                    });
                } else {
                    self.fetchCached({
                        origin: self.fetchOrigin + 'Cached',
                        callbacks: {
                            complete: function () {

                                if (Configuration.shouldRenderCachedOffersServerSide) {
                                    self.setupInitialOffers();
                                }

                                self.fetchLiveOffers({
                                    crossSellModel: self.crossSellModel
                                });
                            }
                        }
                    });
                }
            },
            setupFlightModules: function (offersCollectionView) {
                var flux = new Marionette.Application();

                flux.on('before:start', function () {
                    var RegionContainer = Marionette.LayoutView.extend({
                        el: '.site-content',
                        regions: {
                            flightModuleList: '#flightModuleList'
                        }
                    });
                    flux.regions = new RegionContainer();
                });
                flux.start();
                flux.regions.flightModuleList.show(offersCollectionView);
            },
            setupInitialOffers : function () {
                var self = this,
                    router,
                    offersCollectionView,
                    $listingsHeader;

                if (true === Configuration.view.isByot) {
                    require(['setupRouter'], function (setupRouter) {
                        router = setupRouter();
                    });
                    $listingsHeader = $('#listings-header');
                }

                offersCollectionView = new OffersCollectionView({
                    collection: uiModel.viewableOffers,
                    router: router,
                    $listingsHeader: $listingsHeader
                });

                self.setupFlightModules(offersCollectionView);
                self.setupDomRefresh(offersCollectionView);
                self.offersCollectionView = offersCollectionView;
            },

            initialize: function () {
                var self = this;

                flights.vent.trigger('applicationView.applicationStart');

                experiments.execute('FSR_Mobile_ColumnStyleListings');

                experiments.execute('FSRMobileSlimListings', {});

                if (dctk && dctk.ewePerformance) {
                    dctk.ewePerformance.mark('applicationStart');
                }

                if (!Configuration.shouldRenderCachedOffersServerSide) {
                    self.setupInitialOffers();
                }

                self.createChildViews();

                flights.collections.legsCollection = new LegsCollection();

                if (Configuration.xsell.hotel.enabled) {
                    self.setupCrossSellModels();
                }

                ScratchpadModal.initialize({
                    departure: {
                        airport: self.wizardView.model.attributes.trips.first().get('departure').get('airport'),
                        date: self.wizardView.model.attributes.trips.first().get('departure').get('date').get('shortFormat')
                    },
                    arrival: {
                        airport: self.wizardView.model.attributes.trips.first().get('arrival').get('airport'),
                        date: self.wizardView.model.attributes.trips.first().get('arrival').get('date').get('shortFormat')
                    },
                    numberOfAdults: self.wizardView.model.attributes.travelerPreferences.get('numberOfAdults'),
                    numberOfChildren: self.wizardView.model.attributes.travelerPreferences.get('numberOfChildren'),
                    preferredAirline: self.wizardView.model.attributes.travelerPreferences.get('preferredAirline'),
                    nonStopOnly: self.wizardView.model.attributes.travelerPreferences.get('nonstopOnly'),
                    refundableOnly: self.wizardView.model.attributes.travelerPreferences.get('refundableOnly')
                });

                analytics.initializeOmnitureData();

                self.makeInitialRequest();

                if(Configuration.routeHappyEnabled) {
                    self.initializeRouteHappy();
                }

                liveAnnounceDispatcher.initialize();

                flights.vent.trigger('applicationView.initialized', {appView: self});

                experiments.execute('BAGGAGECALCULATOR.MODAL', {});

                experiments.execute('REASSURANCEINXSELL.MODAL', {});

                experiments.execute(experiments.events.FLUX_INITIALIZE, {});
            }

        });

        function logJsonCacheResult(isExactCacheHit, singlePageModel, wizardModel) {
            var originAirport = singlePageModel.get('departureAirportCode'),
                destinationAirport = singlePageModel.get('arrivalAirportCode'),
                departureDate = singlePageModel.get('departureISODate'),
                returnDate = singlePageModel.get('arrivalISODate'),
                adultCount = wizardModel.attributes.travelerPreferences.get('numberOfAdults'),
                childCount = wizardModel.attributes.travelerPreferences.get('numberOfChildren'),
                eapid = dctk._eapid,
                tpid = dctk._tpid;

            dctk.logging.logTrxEvent('jsonCacheResult',
                [
                    'exactCacheHit=' + (isExactCacheHit ? 1 : 0),
                    'originAirport="' + originAirport + '"',
                    'destinationAirport="' + destinationAirport + '"',
                    'departureDate="' + departureDate + '"',
                    'returnDate="' + returnDate + '"',
                    'adultCount="' + adultCount + '"',
                    'childCount="' + childCount + '"',
                    'eapid=' + eapid,
                    'tpid=' + tpid
                ]);
        }
    });

/* static_content/default/default/scripts/exp/flights/flux/views/CachedOfferListView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('cachedOfferListView', ['flights', 'jquery', 'uitk', 'cachedOfferView', 'offersCollection', 'backbone', 'configuration', 'uiModel', 'experiments'], function(flights, $, uitk, CachedOfferView, OffersCollection, Backbone, configuration, uiModel, experiments) {
    'use strict';

    function getRandomIntegerFromRange(min, max) {
        if ('number' !== typeof min ||
            'number' !== typeof max ||
            min >= max) {
            return;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    return new (Backbone.View.extend({ //TODO: have applicationView call constructor during baseline/cleanup of 13222

        tagName: 'ul',

        collection: new OffersCollection(),

        config: {
            chunkSize: 3,
            baseTimeout: 25,
            animationSpeed: 750
        },

        hide: function(){
            this.$el.hide();
        },

        initialize: function () {
            var self = this;

            self.setElement($('#cachedOfferList'));
            self.listenTo(self.collection, 'change', function() {
                self.render();
            });

            self.listenTo(uiModel, 'responseError', self.hide);
            self.listenTo(uiModel, 'noFlightsFound', self.hide);
            self.listenTo(flights.vent, 'uiModel.resultsFetchFailure', self.hide);

        },

        setOffers: function(options){
            experiments.execute('FSR_Rewritten_Cached_Offer_List_View', this);

            if(configuration.view.isByot){
                _.each(options.offers, function(offer) {
                    offer.legIds = [offer.legIds[0]];
                });
            }

            this.collection.set(options.offers);
            this.collection.trigger('change');
        },

        render: function () {
            var self = this,
                i, arrayChunk,
                fnArray = [],
                timeout,
                cachedOfferCollection = self.collection.last(self.collection.length).reverse();

            self.$el.empty();
            
            experiments.execute('FSR_OW_PARTIAL_MATCH_NO_ANIMATION', {
                cachedOfferCollection: cachedOfferCollection,
                container: self.$el
            });

            if (experiments.getVariant(13326) > 0) {
                return;
            }

            _.each(cachedOfferCollection, function(offer) {
                var cachedOfferView,
                    offerModel = {model: offer},
                    isBargainOffer = offer.get('bargainOffer');

                if(!isBargainOffer) {
                    cachedOfferView = new CachedOfferView(offerModel);
                    fnArray.push((function(renderedOffer){
                        return function(){
                            return renderedOffer.el;
                        };
                    }(cachedOfferView.render())));
                }
            });

            for (i = 0, timeout = self.config.baseTimeout; i < fnArray.length; i += self.config.chunkSize, timeout += getRandomIntegerFromRange(1000,1500)) {
                arrayChunk = fnArray.slice(i, i + self.config.chunkSize).reverse();
                setTimeout((function(chunk){
                    return function(){
                        var markup = $('<div />');

                        $.each(chunk, function(index, fn){
                            markup.append(fn());
                        });

                        $(markup).hide().prependTo(self.$el).slideDown(self.config.animationSpeed);
                        self.collection.trigger('cacheChunkRendered', {});
                        flights.vent.trigger('cachedOfferListView.cacheChunkRendered', {cachedOfferListView: self, config: self.config});
                    };
                }(arrayChunk)), timeout);
            }

            $('#cachedResultsJson').attr('data-test-id', 'cacheRendered');
        }
    }))();
});

/* static_content/default/default/scripts/exp/flights/flux/views/ListItemView.js */
/*jslint browser: true, unparam: true, todo: true, nomen: true*/
/*global define, require, console */

define('listItemView', ['flights', 'jquery', 'underscore', 'backbone', 'loyaltyPointsCollection', 'loyaltyPointsView', 'flexibleShoppingLoyaltyEarnView', 'experiments', 'sitebrand', 'basicEconomyView', 'detectizr'], function (flights, $, _, Backbone, loyaltyPointsCollection, LoyaltyPointsView, FlexibleShoppingLoyaltyEarnView, experiments, sitebrand, BasicEconomyView, detectizr) {
    'use strict';

    function freeFlightPackagePromotionSticker(offer) {
        var freeFlightPackagePromotionSS;

        if(offer.freeFlightPromotionContent && offer.freeFlightPromotionContent.sticker) {

            freeFlightPackagePromotionSS = offer.freeFlightPromotionContent.sticker;
        }

        return freeFlightPackagePromotionSS !== null &&
            (freeFlightPackagePromotionSS === 'SuperSaverPromotion' || freeFlightPackagePromotionSS === 'FreeFlightPromotion');
    }

    function freeFlightPackagePromotionSuperSaverType(offer) {
        var freeFlightPackagePromotionSSType;

        if(offer.freeFlightPromotionContent && offer.freeFlightPromotionContent.sticker) {

            freeFlightPackagePromotionSSType = offer.freeFlightPromotionContent.sticker;
            if (freeFlightPackagePromotionSSType === 'SuperSaverPromotion') {
                return true;
            }
        }

        return false;
    }

    function getSuperlatives(offer) {
        var superlatives = [];

        if (undefined !== offer) {
            if (offer.bestValue) {
                superlatives.push("BV");
            }
            if (offer.cheapest) {
                superlatives.push("CP");
            }
            if (offer.shortest) {
                superlatives.push("ST");
            }
        }
        return superlatives.join();
    }

    function getDPSDimensions(offer) {
        var dimensions = [];
        if (offer.bestPrice) {
            dimensions.push("BP");
        }
        if (offer.bestDuration) {
            dimensions.push("BD");
        }
        if (offer.bestTimeOfDay) {
            dimensions.push("BTOD");
        }
        return dimensions.join('|');
    }

    function shouldShowFreeCancelForOffer(offer) {
        var showFreeCancel = false,
            isNotBargainFare = !offer.bargainOffer;
        _.each(offer.legs, function (leg) {
            if (leg.price.feesMessage && leg.price.feesMessage.isShowFreeCancellation && leg.price.feesMessage.matchDataAirProvider && isNotBargainFare) {
                showFreeCancel = true;
            }
        });

        return showFreeCancel;
    }

    return Backbone.View.extend({

        id: function () {
            return 'flight-module-' + this.model.get('naturalKey').replace(/;/g, '_');
        },
        tagName: 'li',
        loyaltyView: null,

        createLoyalty: function (populatedOffer) {
            populatedOffer.naturalKey = populatedOffer.naturalKey.replace(/::/g, ':');
            if (loyaltyPointsCollection.isLoyaltyOfferEnabled) {
                if(!loyaltyPointsCollection.isFlexibleShoppingEnabled) {
                    this.loyaltyView = new LoyaltyPointsView({
                        model: loyaltyPointsCollection,
                        offer: populatedOffer,
                        el: this.el,
                        loyaltyInfo: loyaltyPointsCollection.loyaltyInfo
                    });
                }
                else {
                    this.loyaltyView = new FlexibleShoppingLoyaltyEarnView({
                        model: loyaltyPointsCollection,
                        offer: populatedOffer,
                        el: this.el,
                        loyaltyInfo: loyaltyPointsCollection.loyaltyInfo
                    });
                    experiments.execute("OrbitzPromoTimer", populatedOffer);
                }
            }
        },

        createBasicEconomy: function (populatedOffer) {
            var isMobile = detectizr.device.type === 'mobile';
            var isTvly = sitebrand.siteid === '80001';

            if (isTvly && isMobile) {
                return;
            }
            if(populatedOffer.legs[0].basicEconomy !== undefined && populatedOffer.legs[0].basicEconomy.enabled) {
                var basicEconomyElement = this.$el.find('.basic-economy-main');
                this.basicEconomyView = new BasicEconomyView({$basicEconomyElement: basicEconomyElement, rules: populatedOffer.legs[0].basicEconomy.rules});
            }
        },

        attributes : {
            'data-is-split-ticket' : 'splitTicket',
            'data-discount' : 'discount',
            'data-is-packageable' : 'packageable'
        },

        getFullOfferModel: function (listItemView) {
            var offer = { legs: []},
                legIdentityIndexes = [];

            $.extend(true, offer, listItemView.model.toJSON());

            $.each(offer.legIds, function (i, legNaturalKey) {
                var leg = flights.collections.legsCollection.models[0].get(legNaturalKey);

                // TODO: Add unit tests
                if (undefined === leg) {
                    return 'continue';
                }
                offer.legs[i] = leg;
                legIdentityIndexes.push(leg.identity.index);
            });

            offer.naturalKey = offer.naturalKey.replace(/:/g, '::');
            offer.numLegs = offer.legs.length;
            offer.superlatives = getSuperlatives(offer);
            offer.dpsDimensions = getDPSDimensions(offer);
            offer.freeFlightPackagePromotionSticker = freeFlightPackagePromotionSticker(offer);
            offer.freeFlightPackagePromotionSuperSaverType = freeFlightPackagePromotionSuperSaverType(offer);

            var apacSiteId = ['1255', '1256', '1257', '2000', '2001', '2002', '2004', '2023'];
            var siteId = sitebrand.siteid;
            if (apacSiteId.indexOf(siteId) > -1 ){
                offer.freeFlightPackagePromoRed = true;
            }

            if (undefined === offer.legIndexList) {
                offer.legIndexList = legIdentityIndexes.join(','); //needed for non-uimodel path
            }

            return offer;
        },
        getNestedAttributesFromOffer: function (offer, key1, key2) {
            return _.chain(offer.legs)
                .pluck(key1)
                .pluck(key2)
                .value()
                .join(',');
        },
        getMarkup: function (populatedOffer, showFreeCancelForOffer) {
            return this.template({module: populatedOffer, showFreeCancelForOffer: showFreeCancelForOffer});
        },

        render: function () {
            var populatedOffer = this.getFullOfferModel(this),
                showFreeCancelForOffer = shouldShowFreeCancelForOffer(populatedOffer),
                markup,
                self = this;

            $.each(self.attributes, function (key, value) {self.$el.attr(key, self.model.get(value)); });

            markup = this.getMarkup(populatedOffer, showFreeCancelForOffer);

            this.$el.html(markup);

            this.createBasicEconomy(populatedOffer);

            this.createLoyalty(populatedOffer);

            return this;
        }

    });
});

/* static_content/default/default/scripts/exp/flights/flux/views/StandardOfferView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen:true */
/*global define, require, console */

define('standardOfferView', ['backbone', 'jquery', 'handlebars', 'listItemView', 'standardOfferDetailsView','baggageFeeView', 'configuration', 'underscore'],
    function(Backbone, $, handlebars, ListItemView, StandardOfferDetailsView, BaggageFeeView, configuration, _) {

    'use strict';

    function isEmpty(obj) {
        return obj === undefined || obj === null || obj === '';
    }

    function constructOmniture(module) {
        var isFlexibleShoppingEnabled, label, urgencyMessage;
        isFlexibleShoppingEnabled = configuration.isFlexibleShoppingEnabled === true;
        label = [];

        if (isFlexibleShoppingEnabled) {

            label.push('PKG.FSR.Select');

            if (!module.bestPick) {
                return label[0];
            }

            if (!module.defaultFlight) {
                label.push('NonDPS');
            } else {
                label.push('DPS');
            }

            if(module.dpsDimensions){
                label.push(module.dpsDimensions);
            }

        } else {

            label.push('Select');

            if (module.isCached) {
                label.push('CachedPrice.ExactMatch');
                return label.join('.');
            }

            if (module.price.hasFare === false) {
                label.push('CTP');
            }

            if (module.bestValue) {
                label.push('BestValue');

            } else if (module.cheapest) {
                label.push('Cheapest');

            } else if (module.shortest) {
                label.push('Shortest');
            }

            urgencyMessage = module.legs[0].carrierSummary.noOfTicketsLeft;
            if (module.legs[0].carrierSummary.displayUrgencyMessage === true && urgencyMessage !== undefined) {
                label.push('Urgency' + module.legs[0].carrierSummary.noOfTicketsLeft);
            }
        }
        return label.join('.');
    }

    function addLegIds(module, attributeStrings) {
        _.each(module.legs, function (leg, index) {
            attributeStrings.push('leg' + index + '-natural-key:' + escapeAttributeValue(leg.naturalKey));
        });
    }

    function escapeAttributeValue(value) {
        return value.replace(/:/g, '::');
    }

    return ListItemView.extend({

        className: function() {
            var classes = ['flight-module', 'segment', 'offer-listing'];
            if (this.model.get('bestPick')) {
                classes.push('best-pick');
            }
            return classes.join(' ');
        },
        events: {
            'click a.open-bag-fee': 'openBaggageFeeLink'
        },

        initialize: function(options) {
            this.template = handlebars.templates.standardOffer;

            ListItemView.prototype.initialize.call(this, options);
            var offerModel = this.model;
            this.standardOfferDetailsView = new StandardOfferDetailsView({model: offerModel, el: this.el});
            this.baggageFeeView = new BaggageFeeView({model: {offer: offerModel}, el: this.el});
        },

        openBaggageFeeLink: function(event){
            this.baggageFeeView.baggageFeeLinkHelper(event);
        },
        getDataAttributes: function(module) {
            var attributeStrings, map;

            map = {
                'test-id': 'select-button',
                'bargain-fare': 'false',
                'click-handler': 'select-flight,omnitureClickHandler',
                'prevent-expand': 'true',
                'omniture-rfrr': constructOmniture(module),
                'trip-id': module.isEpcPinnedListingOffer ? module.originalNaturalKey : module.naturalKey,
                'offer-index': module.index,
                'has-fare': typeof(module.price) === 'object' && module.price.hasFare === true,
                'leg-indexes': module.legIndexList,
                'superlatives': module.superlatives,
                'outbound-airlinecodes': module.legs[0] ? module.legs[0].carrierSummary.airlineCodes : undefined,
                'inbound-airlinecodes': module.legs[1] ? module.legs[1].carrierSummary.airlineCodes : undefined,
                'is-cached': module.isCached === true,
                'result-token': module.resultToken
            };

            if(!isEmpty(module.hotelId)) {
                map['hotel-data'] = module.hotelId;
            }

            if(!isEmpty(module.carData)) {
                map['car-data'] = module.carData;
            }

            if (module.price !== undefined && module.price.pricedFlight) {
                $.extend(true, map, {
                    'air-provider-id': this.getNestedAttributesFromOffer(module, 'carrierSummary', 'airProviderId'),
                    'flight-fare-type-code': this.getNestedAttributesFromOffer(module, 'price', 'flightFareTypeCode'),
                    'flight-fare-type-value': this.getNestedAttributesFromOffer(module, 'price', 'flightFareTypeValue'),
                    'is-split-ticket': module.splitTicket,
                    'discount': module.discount,
                    'is-packageable': module.packageable
                });
            }
            attributeStrings = _.chain(map).keys(map).map(function (key) {
                var value = map[key];
                if(value === undefined || value === null) {
                    value = '';
                }
                return key + ':' + value;
            });

            addLegIds(module, attributeStrings);

            return attributeStrings.join('|').value();
        },
        getStandardOfferClasses: function (module) {
            var standardOfferClasses = ['flex-card-offer'];
            if (module.isCached) {
                standardOfferClasses.push('flex-card-offer-cached');
            }
            return standardOfferClasses.join(' ');
        },
        getPartnerLoyaltyBrandedFareName: function (module) {
            var i = 0;
            var j = module.legs.length;
            for (i = 0; i < j; i += 1) {
                if (module.legs[i].partnerLoyaltyBrandedFare &&
                    module.legs[i].partnerLoyaltyBrandedFare.brandedFareName) {
                    return module.legs[i].partnerLoyaltyBrandedFare.brandedFareName
                }
            }
            return '';
        },
        getMarkup: function (populatedOffer, showFreeCancelForOffer) {
            return this.template({
                module: populatedOffer,
                showFreeCancelForOffer: showFreeCancelForOffer,
                isMultiDestination: configuration.route.isMultiDest,
                isByot: configuration.view.isByot,
                useTripStrings: configuration.route.isMultiDest,
                isFlexibleShoppingWithPackagePricing: configuration.isFlexibleShoppingWithPackagePricing,
                isOfferPlacementBelowSelectButton: configuration.loyalty.isOfferPlacementBelowSelectButton,
                shouldDisplayFareType: configuration.displayFareType && populatedOffer.brandedFare && populatedOffer.brandedFare.brandedFareName,
                shouldDisplayFareTypeForLeg: configuration.displayFareTypeForLeg,
                partnerLoyaltyBrandedFareName: this.getPartnerLoyaltyBrandedFareName(populatedOffer),
                shouldDisplayFeeMessage: configuration.displayOBFees && configuration.obFeeThinListing,
                showObFeeMessageFFOP: configuration.showObFeeMessageFFOP,
                shouldUseHandBaggageOnlyMessage: configuration.baggageFee.useHandBaggageOnlyMessage,
                shouldUseMultipleBagFeeStrings: configuration.baggageFee.useMultipleBagFeeStrings,
                shouldUseThinListingBaggageFeeLink: configuration.baggageFee.useThinListingBaggageFeeLink,
                partnerLoyaltyPointsPerPerson: configuration.loyalty.partnerLoyaltyPointsPerPerson,
                dualPricingDisplayForCardFeesEnabled: configuration.dualPricingDisplayForCardFeesEnabled,
                isFromPriceTextEnabled: configuration.isFromPriceTextEnabled,
                partnerPointsEnabled: configuration.loyalty.partnerPointsEnabled,
                standardOfferClasses: this.getStandardOfferClasses(populatedOffer),
                dataAttributes: this.getDataAttributes(populatedOffer)
            });
        }
    });
});

/* static_content/default/default/scripts/exp/flights/flux/views/BaggageFeeView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, laxcomma: true*/
/*global define, require, console */

define('baggageFeeView', ['flights', 'jquery', 'backbone', 'configuration'], function(flights, $, Backbone, configuration) {
    'use strict';

    function constructLegs(offerModel) {
        var legs = offerModel.get('legs') || [],
            leg;

        if (legs.length > 0) {
            $.each(legs, function(index, value){
                value = $.extend(value,
                    {'distanceUnit' : configuration.roundTrip.distanceUnit, 'showOnTimeLink' : configuration.roundTrip.showOnTimeLink, 'onTimeLink' : configuration.roundTrip.onTimeLink}
                );
            });
        } else {
            $.each(offerModel.get('legIds'), function (index, value) {
                leg = $.extend(flights.collections.legsCollection.models[0].get(value),
                    {'distanceUnit': configuration.roundTrip.distanceUnit, 'showOnTimeLink': configuration.roundTrip.showOnTimeLink, 'onTimeLink': configuration.roundTrip.onTimeLink}
                );
                legs.push(leg);
            });
        }

        $.each(legs, function (index, value) {
            $.extend(value,
                { selected: index === 0 /* this decides which tab is selected (uitk.tabs forces us to do it like this when using it and handlebars together) */ }
            );
        });

        return legs;
    }

    function isStringBlankOrEmpty(testString) {
    	return testString === undefined || testString === null;
    }

    return Backbone.View.extend({
        inlineAjaxUrl : '/api/flight/bagfeesmcfilterbyac',
        externalPageUrl : '/Flights-BagFeesFilterByAC?',

        initialize: function () {
            this.model.legs = constructLegs(this.model.offer);
            this.model.fareBasisDetails = this.model.offer.get('fareBasisDetails');
        },

        constructBaggageFeeURL: function(legIndex, offerModel) {
            var baseURL = this.externalPageUrl,
            parameters = [],
            leg = offerModel.legs[legIndex],
            fareBasisDetail = offerModel.fareBasisDetails[leg.naturalKey],
            operatedBy = leg.timeline[0].carrier.operatedByAirlineCode,
            airCarrierCode = leg.timeline[0].carrier.airlineCode,
            travelDate = leg.timeline[0].departureTime.travelDate,
            travelDateSplit,
            actionUrl;

            parameters.push('originapt='+leg.departureLocation.airportCode);
            parameters.push('destinationapt='+leg.arrivalLocation.airportCode);
            parameters.push('cabinclass='+fareBasisDetail.cabinCategoryCodes[0]);
            parameters.push('mktgcarrier='+leg.timeline[0].carrier.airlineCode);
            parameters.push('bookingclass='+fareBasisDetail.bookingCodes[0]);
            if (!isStringBlankOrEmpty(fareBasisDetail.fareBasisCode)) {
                parameters.push('farebasis='+fareBasisDetail.fareBasisCode);
            }

            if ((typeof airCarrierCode === 'string' && airCarrierCode !== '') && (typeof operatedBy !== 'string' || operatedBy === '')) {
                operatedBy = airCarrierCode;
            }
            if ((typeof operatedBy === 'string' && operatedBy !== '') && (typeof airCarrierCode !== 'string' || airCarrierCode === '')) {
                operatedBy = airCarrierCode;
            }
            // Change the URL to ISO yyyy-MM-dd format so that it shows up on the URL QueryString as required.
            if (typeof travelDate === 'string' && travelDate.indexOf('/') > -1) {
                travelDateSplit = travelDate.split('/');
                travelDate = (parseInt(travelDateSplit[2],10) + 2000).toString() + '-' + travelDateSplit[0] + '-' + travelDateSplit[1];
            }

            parameters.push('opcarrier='+operatedBy);
            parameters.push('traveldate='+travelDate);
            parameters.push('flightnumber='+leg.timeline[0].carrier.flightNumber);

            return parameters.join('&');
        },

        baggageFeeLinkHelper: function(event) {
            window.open(this.externalPageUrl + this.constructBaggageFeeURL(this._getLegIndex(event), this.model));
        },

        _getLegIndex: function(event) {
            return $(event.target).data('legIndex') !== undefined ? $(event.target).data('legIndex') : $(event.target).parent().data('legIndex');
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/CachedOfferView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen:true */
/*global define, require, console */

define('cachedOfferView', ['flights', 'jquery', 'handlebars', 'listItemView', 'configuration'], function(flights, $, handlebars, ListItemView, configuration) {

    'use strict';

    return ListItemView.extend({

        className: 'flight-module segment offer-listing cached-offer',

        initialize: function(model){
            var self = this;
            self.template = handlebars.templates.fluxCachedOfferTemplate;
        },

        getMarkup: function (populatedOffer, showFreeCancelForOffer) {
          return this.template({
              module: populatedOffer,
              showFreeCancelForOffer: showFreeCancelForOffer,
              shouldDisplayFareType: configuration.displayFareType && populatedOffer.brandedFare && populatedOffer.brandedFare.brandedFareName,
              partnerLoyaltyValue: populatedOffer.partnerLoyaltyValue,
              partnerPointsEnabled: configuration.loyalty.partnerPointsEnabled,
              partnerLoyaltyPointsPerPerson: configuration.loyalty.partnerLoyaltyPointsPerPerson
          });
        }

    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/BargainOfferView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('bargainOfferView', ['backbone', 'jquery', 'handlebars', 'listItemView', 'sitebrand', 'configuration'], function(Backbone, $, handlebars, ListItemView, sitebrand, configuration) {
    'use strict';

    function generateHotwireBargainFareTitle(offer) {
        var firstLeg = offer.legs[0],
            firstLegDepartureHour,
            bargainFareString = '',
            numStopsKey = '',
            nonDelta = firstLeg.nonDelta;
        if (firstLeg.hotwireMarketing) {
            firstLegDepartureHour = firstLeg.departureTime.hour;
            if (nonDelta) {
                if (firstLegDepartureHour >= 0 && firstLegDepartureHour < 3) {
                    bargainFareString = 'departureTime_12a_3a';
                } else if (firstLegDepartureHour >= 3 && firstLegDepartureHour < 6) {
                    bargainFareString = 'departureTime_3a_6a';
                } else if (firstLegDepartureHour >= 6 && firstLegDepartureHour < 9) {
                    bargainFareString = 'departureTime_6a_9a';
                } else if (firstLegDepartureHour >= 9 && firstLegDepartureHour < 12) {
                    bargainFareString = 'departureTime_9a_12p';
                } else if (firstLegDepartureHour >= 12 && firstLegDepartureHour < 15) {
                    bargainFareString = 'departureTime_12p_3p';
                } else if (firstLegDepartureHour >= 15 && firstLegDepartureHour < 18) {
                    bargainFareString = 'departureTime_3p_6p';
                } else if (firstLegDepartureHour >= 18 && firstLegDepartureHour < 21) {
                    bargainFareString = 'departureTime_6p_9p';
                } else {
                    bargainFareString = 'departureTime_9p_12a';
                }
                if (firstLeg.stops === 0) {
                    numStopsKey = 'nonstop';
                } else if (firstLeg.stops === 1) {
                    numStopsKey = 'oneStop';
                } else {
                    numStopsKey = 'multipleStops';
                }
            } else {
                if(firstLegDepartureHour >= 6 && firstLegDepartureHour < 22) {
                    bargainFareString = 'bargain_fare_day_time';
                } else {
                    bargainFareString = 'bargain_fare_night_time';
                }
                if (firstLeg.stops < 2) {
                    numStopsKey = 'bargain_trip_stops';
                } else {
                    numStopsKey = 'bargain_trip_multiple_stops';
                }
            }
        }

        return {
            bargainFareTextKey: bargainFareString,
            numStopsKey: numStopsKey,
            delta: !nonDelta
        };
    }

    function getOmnitureElements(offer) {
        var omnitureElements = '',
            firstLegCarrierSummary = offer.legs[0] ? offer.legs[0].carrierSummary : undefined;

        if (offer.bargainOffer) {
            omnitureElements += '.EBF';
        }

        if (offer.bestValue) {
            omnitureElements += '.BestValue';
        } else if (offer.cheapest) {
            omnitureElements += '.Cheapest';
        } else if (offer.shortest) {
            omnitureElements += '.Shortest';
        }

        if (firstLegCarrierSummary && firstLegCarrierSummary.displaySeatUrgency) {
            omnitureElements += '.Urgency' + firstLegCarrierSummary.noOfTicketsLeft;
        }

        return omnitureElements;
    }



    function getDataAttributes(offer) {
        var data, self;
        self = this;

        data = {
            testId: 'select-button',
            clickHandler: 'select-flight,omnitureClickHandler',
            omnitureTail: getOmnitureElements(offer),
            airProviderIds: self.getNestedAttributesFromOffer(offer, 'carrierSummary', 'airProviderId'),
            flightFareTypeCodes: self.getNestedAttributesFromOffer(offer, 'price', 'flightFareTypeCode'),
            flightFareTypeValues: self.getNestedAttributesFromOffer(offer, 'price', 'flightFareTypeValue')
        };

        return data;
    }

    return ListItemView.extend({
        className: 'ebf-module flight-module segment offer-listing',
        template: handlebars.templates.bargainoffer,

        render: function () {
            var populatedOffer = this.getFullOfferModel(this),
                markup,
                brand = configuration.displayBrandNameForBargainFare ? sitebrand.brandname : '',
                self = this;

            $.each(self.attributes, function (key, value) {
                self.$el.attr(key, self.model.get(value));
            });

            markup = this.template({
                module: populatedOffer,
                dataAttributes: getDataAttributes.call(this, populatedOffer),
                brandName: brand,
                hotwireTextKeys: generateHotwireBargainFareTitle(populatedOffer)
            });

            this.$el.html(_.unescape(markup.replace(/&#x3D;/gi, '=')));
            this.createLoyalty(populatedOffer);

            return this;
        }
    });
});

/* static_content/default/default/scripts/exp/flights/flux/views/FilterItemView.js */
/*jslint browser: true, unparam: false, white: true, todo: true, nomen: true */
/*global define, require, console */

define('filterItemView', ['flights', 'handlebars', 'backbone', 'underscore','configuration', 'analytics'],
    function(flights, handlebars, Backbone, _, Configuration, analytics) {
    'use strict';

    return Backbone.View.extend({
        tagName: 'label',
        ariaFilterLabel: '',
        ariaFilterLegendId: '',
        categoryTitle: '',
        filterType: '',
        className: 'check filter-option',
        attributes: {},
        template: handlebars.templates.filterItemTemplate,

        events: {
            'click input[type="checkbox"]:checked': 'logOmniture',
            'click input[type="checkbox"]:not(:checked)': 'logOmnitureDisable'
        },

        initialize: function (options) {
            this.label = options.label;
            this.ariaFilterLegendId = options.ariaFilterLegendId;
            this.categoryId= options.categoryId;
            this.ariaText = options.ariaText;
            this.filterType = options.filterType;
            this.input = options.input;
            this.showCount = options.showCount || false;
            this.categoryTitle = options.categoryTitle;

            var self = this;

            if(true === options.appendLegToName) {
                require(['setupRouter'], function (setupRouter) {
                    var router = setupRouter();

                    flights.vent.on('uiModel.resetViewableOffers', function (options) {

                        if(typeof options === 'object' && options.source === 'client') { return; }

                        var name = self.input.name;
                        name = name.replace(/\d+/g, '');
                        name = name + router.getNextLegToView();
                        self.input.name = name;
                        self.render();
                    });
                });
            }

            this.listenTo(this.model, 'change:formattedPrice', this.updateFormattedPrice);
            this.listenTo(this.model, 'change:totalCount', this.updateFilterVisibility);
            this.listenTo(this.model, 'change:checked', this.updateCheckedState);
            this.render();

            this.listenTo(flights.vent, 'uiModel.fetching', function(data){
                if('Cache.ExactMatch' !== data.cacheType && 'InitialSearch' === data.fetchOrigin) {
                    this.$el.find('input').prop('disabled', true);
                }
            });
        },

        render: function () {
            this.createAriaFilterLabelStrings();
            this.$el.html(this.template(_.extend(_.clone(this.model.toJSON()), {
                label: this.label,
                input: this.input,
                showCount: this.showCount,
                checked: this.model.get('checked'),
                categoryTitle: this.categoryTitle,
                isTotalCountOne: this.isTotalCountOne(),
                isFlexibleShopping: Configuration.isFlexibleShoppingEnabled
            })));
            this.$el.find('.a11y-filters-tag').attr('id', (this.ariaFilterLabel) + '-flights-checkbox');
            this.$el.find('input').attr('aria-labelledby', this.ariaFilterLegendId + '-legend ' + this.ariaFilterLabel + '-flights-checkbox');
            this.delegateEvents();
            return this;
        },

        createAriaFilterLabelStrings: function () {
            if (this.filterType === 'airports') {
                this.ariaFilterLabel = this.label.substr(0,3);
            } else if (this.filterType === 'stops' && this.label !== 'Nonstop'){
                this.ariaFilterLabel = this.label.substr(0,1) + '-stop';
            } else if (this.filterType === 'airlines'){
                this.ariaFilterLabel = this.label.replace(/\W/g,'-');
            } else if (this.filterType === 'flight-time') {
                this.ariaFilterLabel = this.categoryId + '-' + this.label.match(/\w+/,'');
            } else {
                this.ariaFilterLabel = this.label;
            }
        },

        isTotalCountZero: function () {
            return this.model.get('totalCount') === 0;
        },

        isTotalCountOne: function () {
            return this.model.get('totalCount') === 1;
        },

        updateFilterVisibility: function () {
            if(this.isTotalCountZero()) {
                this.hide();
            } else {
                this.show();
            }
        },

        updateCheckedState: function () {
            this.$el.find('input').attr('checked', this.model.get('checked') || false);
        },

        updateFormattedPrice: function () {
            this.$el.find('.from-price').text(this.model.get('formattedPrice'));
        },

        hide: function () {
            this.$el.hide();
            this.$el.attr('aria-hidden', true);
        },

        show: function () {
            this.$el.css({ display: '' }); //.show(); does display: block, we don't want that here
            this.$el.attr('aria-hidden', false);
        },

        logOmniture: function (event) {
            analytics.trackAction(this.input.data.omnitureRfrr, event.target);
        },

        logOmnitureDisable: function (event) {
            analytics.trackAction(this.input.data.omnitureRfrr + '.Disable', event.target);
        }
    });
});

/* static_content/default/default/scripts/exp/flights/flux/views/ToggleView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('toggleView', ['uitk', 'handlebars', 'jquery', 'backbone'], function(uitk, handlebars, $, Backbone) {
    'use strict';

    return Backbone.View.extend({
        /* This toggle view has been written to support requirements
         * for existing toggles; some parameters of the UITK toggle
         * are not implemented. For example, dataAttributes, icon
         */
        parameters: {
            transition: 'fade'
        },
        initialize: function (options) {
            this.template = handlebars.templates.toggleTemplate;
            this.parameters = $.extend(true, {}, this.parameters, options.parameters);
        },
        render: function () {
            this.$el.html(this.template(this.parameters));
            return this;
        },
        appendMarkupToContainer: function (markup) {
            this.$el.find('.toggle-pane').append(markup);
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/FiltersView.js */
/*jslint browser: true, unparam: false, white: true, todo: true, nomen: true */
/*global define, require, console, dctk */

define('filtersView',
       ['jquery', 'flights', 'handlebars', 'filterPillsView', 'airportFiltersView', 'stopFiltersView', 'uitk', 'i18n', 'filtersModel', 'airlineFiltersView', 'timeFiltersView', 'configuration', 'backbone', 'underscore', 'uiModel', 'experiments'],
       function($, flights, handlebars, FilterPillsView, AirportFiltersView, StopFiltersView, uitk, i18n, FiltersModel, AirlineFiltersView, TimeFiltersView, Configuration, Backbone, _, uiModel, experiments) {

    'use strict';

    var shouldSaveCheckedState = true,
        setInitialState = function(){
           if(uiModel.viewableOffers.length === 0){
               this.$el.hide();
           } else {
               this.$el.show();
           }
       };

    return Backbone.View.extend({

        el: $('#columnAFilter'),
        $categoriesContainer: $('#filterContainer'),
        $loader: $('#columnAFilter .filtersLoaderContainer'),
        fetchOrigin: 'Filter',

        events: {
            'change input[type="checkbox"]': 'requestFilteredResults'
        },

        getAjaxData: function () {
            var serialized,
                ajaxData = {},
                $disabled;

            $disabled = this.$categoriesContainer.find('input:disabled').prop('disabled', false);
            serialized = this.$categoriesContainer.find('input').serialize();
            $disabled.prop('disabled', true);

            if ('' !== serialized.trim()) {
                _.each(serialized.split('&'), function (segment) {
                    var tuple = segment.split('='),
                        key = tuple[0],
                        value = decodeURIComponent(tuple[1]);
                    if (undefined !== value && undefined === ajaxData[key]) {
                        ajaxData[key] = value;
                    } else {
                        ajaxData[key] += ',' + value;
                    }

                });
            }

            return ajaxData;
        },

        requestFilteredResults: function (event) {
            var self = this,
                finishedAnnouncement,
                fetchData,
                selectedFilterId = (undefined === event ? '' : event.currentTarget.id),
                interstitialMessage = i18n.filters.interstitial.generic;

            if(undefined !== event){
                interstitialMessage = $(event.currentTarget).data('interstitialMessage') || i18n.filters.interstitial.generic;
            }

            if (0 === this.$categoriesContainer.find('input[type="checkbox"]:checked').length) {
                uitk.utils.liveAnnounce(i18n.filters.accessibility.announceFilteringOff, 'polite');
                finishedAnnouncement = i18n.filters.accessibility.announceClearFilteringComplete;
            } else {
                uitk.utils.liveAnnounce(i18n.filters.accessibility.announceFilteringOn, 'polite');
                finishedAnnouncement = i18n.filters.accessibility.announceFilteringComplete;
            }

            this.filterPillsView.render();
            this.appView.ajaxErrorView.hide();

            flights.vent.trigger('filtersView.filterSelected', {filter: self.getAjaxData(), interstitialMessage: interstitialMessage});
                
                flights.vent.once('uiModel.resetViewableOffers', function(){
                    uitk.utils.liveAnnounce(finishedAnnouncement);
                    $('#' + selectedFilterId).focus();
                });

            if (Configuration.route.isOneWay) {
                if (experiments.getVariant(13031) === 2) {
                    this.changeAirlineFilters = $.noop;
                }
                this.changeArrivalAirportFilters();
                this.changeDepartureTimeFilters();
                this.changeArrivalTimeFilters();
                this.changeAirlineFilters();
                this.changeStopFilters();
            }

        },

        initialize: function (options) {
            var arrivalCity = options.singlePageModel.get('arrivalCity'),
                departureCity = options.singlePageModel.get('departureCity'),
                departureStrings = i18n.filters.time.departure,
                arrivalStrings = i18n.filters.time.arrival,
                outboundDepartureTitle,
                self = this;

            this.model = options.filtersModel || new FiltersModel();
            this.appView = options.appView;

            if('boolean' === typeof options.shouldSaveCheckedState) {
                shouldSaveCheckedState = options.shouldSaveCheckedState;
            }

            self.listenTo(uiModel, 'change:summary', function (model) {
                var summary = model.get('summary');
                if (summary && summary.filters) {
                    self.model.set(summary.filters);
                }
                flights.vent.trigger('filtersView.summaryUpdated');
            });

            if (Configuration.route.isOneWay) {
                outboundDepartureTitle = departureStrings.oneWayCategoryTitle;
            } else {
                outboundDepartureTitle = departureStrings.categoryTitle.replace('{0}', departureCity);
            }

            this.filterPillsView = new FilterPillsView({filtersView: this, model: this.model});

            this.arrivalAirportFiltersView = new AirportFiltersView({id: 'arrivalAirports', leg: 0, isArrival: true});
            this.stopFiltersView = new StopFiltersView();
            this.airlineFiltersView = new AirlineFiltersView();

            this.departureTimeFilters = [
                new TimeFiltersView({ // outbound departure times leg 0
                    id: 'outbound-departure-times',
                    model: new Backbone.Model(),
                    configuration: {
                        categoryTitle: outboundDepartureTitle,
                        earlyMorning: {
                            label: departureStrings.earlyMorning.label,
                            input: {
                                id: 'leg0-earlymorning-departure',
                                name: 'fd0',
                                value: 'em',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.EarlyMorning.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(departureStrings.earlyMorning.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        morning: {
                            label: departureStrings.morning.label,
                            input: {
                                id: 'leg0-morning-departure',
                                name: 'fd0',
                                value: 'm',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.Morning.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(departureStrings.morning.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        afternoon: {
                            label: departureStrings.afternoon.label,
                            input: {
                                id: 'leg0-afternoon-departure',
                                name: 'fd0',
                                value: 'a',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.Afternoon.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(departureStrings.afternoon.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        evening: {
                            label: departureStrings.evening.label,
                            input: {
                                id: 'leg0-evening-departure',
                                name: 'fd0',
                                value: 'e',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.Evening.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(departureStrings.evening.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        }
                    }
                }),
                new TimeFiltersView({ // inbound departure times leg 1
                    id: 'inbound-departure-times',
                    model: new Backbone.Model(),
                    configuration: {
                        categoryTitle: departureStrings.categoryTitle.replace('{0}', arrivalCity),
                        earlyMorning: {
                            label: departureStrings.earlyMorning.label,
                            input: {
                                id: 'leg1-earlymorning-departure',
                                name: 'fd1',
                                value: 'em',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.EarlyMorning.Leg1',
                                    pillLabel: departureStrings.earlyMorning.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        morning: {
                            label: departureStrings.morning.label,
                            input: {
                                id: 'leg1-morning-departure',
                                name: 'fd1',
                                value: 'm',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.Morning.Leg1',
                                    pillLabel: departureStrings.morning.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        afternoon: {
                            label: departureStrings.afternoon.label,
                            input: {
                                id: 'leg1-afternoon-departure',
                                name: 'fd1',
                                value: 'a',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.Afternoon.Leg1',
                                    pillLabel: departureStrings.afternoon.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        evening: {
                            label: departureStrings.evening.label,
                            input: {
                                id: 'leg1-evening-departure',
                                name: 'fd1',
                                value: 'e',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.DeptTime.Evening.Leg1',
                                    pillLabel: departureStrings.evening.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        }
                    }
                })
            ];

            this.arrivalTimeFilters = [
                new TimeFiltersView({ // outbound arrival times leg 0
                    id: 'outbound-arrival-times',
                    model: new Backbone.Model(),
                    configuration: {
                        categoryTitle: arrivalStrings.categoryTitle.replace('{0}', arrivalCity),
                        toggleParameters: {
                            useToggle: !Configuration.view.isByot,
                            omnitureRfrr: 'Filter.ArrTime.Leg0',
                            contentId: 'outboundArrivalTimeToggleLeg0',
                            id: 'arrivalTimeToggleLinkLeg0',
                            expandText: arrivalStrings.toggle.expandText.replace('{0}', arrivalCity),
                            expandAriaText: arrivalStrings.toggle.expandText.replace('{0}', arrivalCity),
                            collapseText: arrivalStrings.toggle.collapseText.replace('{0}', arrivalCity),
                            collapseAriaText: arrivalStrings.toggle.collapseText.replace('{0}', arrivalCity),
                            isOpened: false
                        },
                        earlyMorning: {
                            label: arrivalStrings.earlyMorning.label,
                            ariaText: arrivalStrings.earlyMorning.outbound.aria,
                            input: {
                                id: 'leg0-earlymorning-arrival',
                                name: 'fr0',
                                value: 'em',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.EarlyMorning.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(arrivalStrings.earlyMorning.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        morning: {
                            label: arrivalStrings.morning.label,
                            ariaText: arrivalStrings.morning.outbound.aria,
                            input: {
                                id: 'leg0-morning-arrival',
                                name: 'fr0',
                                value: 'm',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.Morning.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(arrivalStrings.morning.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        afternoon: {
                            label: arrivalStrings.afternoon.label,
                            ariaText: arrivalStrings.afternoon.outbound.aria,
                            input: {
                                id: 'leg0-afternoon-arrival',
                                name: 'fr0',
                                value: 'a',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.Afternoon.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(arrivalStrings.afternoon.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        evening: {
                            label: arrivalStrings.evening.label,
                            ariaText: arrivalStrings.evening.outbound.aria,
                            input: {
                                id: 'leg0-evening-arrival',
                                name: 'fr0',
                                value: 'e',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.Evening.Leg0',
                                    pillLabel: this._getTimeFilterPillStrings(arrivalStrings.evening.outbound.pill),
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        }
                    }
                }),
                new TimeFiltersView({ // inbound arrival times leg 1
                    id: 'inbound-arrival-times',
                    model: new Backbone.Model(),
                    configuration: {
                        categoryTitle: arrivalStrings.categoryTitle.replace('{0}', departureCity),
                        toggleParameters: {
                            useToggle: !Configuration.view.isByot,
                            omnitureRfrr: 'Filter.ArrTime.Leg1',
                            contentId: 'inboundArrivalTimeToggleLeg1',
                            id: 'arrivalTimeToggleLinkLeg1',
                            expandText: arrivalStrings.toggle.expandText.replace('{0}', departureCity),
                            expandAriaText: arrivalStrings.toggle.expandText.replace('{0}', departureCity),
                            collapseText: arrivalStrings.toggle.collapseText.replace('{0}', departureCity),
                            collapseAriaText: arrivalStrings.toggle.collapseText.replace('{0}', departureCity),
                            isOpened: false
                        },
                        earlyMorning: {
                            label: arrivalStrings.earlyMorning.label,
                            ariaText: arrivalStrings.earlyMorning.inbound.aria,
                            input: {
                                id: 'leg1-earlymorning-arrival',
                                name: 'fr1',
                                value: 'em',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.EarlyMorning.Leg1',
                                    pillLabel: arrivalStrings.earlyMorning.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        morning: {
                            label: arrivalStrings.morning.label,
                            ariaText: arrivalStrings.morning.inbound.aria,
                            input: {
                                id: 'leg1-morning-arrival',
                                name: 'fr1',
                                value: 'm',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.Morning.Leg1',
                                    pillLabel: arrivalStrings.morning.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        },
                        afternoon: {
                            label: arrivalStrings.afternoon.label,
                            ariaText: arrivalStrings.afternoon.inbound.aria,
                            input: {
                                id: 'leg1-afternoon-arrival',
                                name: 'fr1',
                                value: 'a',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.Afternoon.Leg1',
                                    pillLabel: arrivalStrings.afternoon.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }                                
                            }
                        },
                        evening: {
                            label: arrivalStrings.evening.label,
                            ariaText: arrivalStrings.evening.inbound.aria,
                            input: {
                                id: 'leg1-evening-arrival',
                                name: 'fr1',
                                value: 'e',
                                data: {
                                    omnitureRfrr: 'FLT.SR.Filter.ArrTime.Evening.Leg1',
                                    pillLabel: arrivalStrings.evening.inbound.pill,
                                    interstitialMessage: i18n.filters.interstitial.time
                                }
                            }
                        }
                    }
                })
            ];

            this.listenTo(this.model, 'change', this.hideLoader);
            this.listenTo(this.model, 'change:stopFilters', this.changeStopFilters);
            this.listenTo(this.model, 'change:airlineFilters', this.changeAirlineFilters);
            if (!Configuration.route.isMultiDest) {
                this.listenTo(this.model, 'change:arrivalAirportFilters', this.changeArrivalAirportFilters);
                this.listenTo(this.model, 'change:departureTimeFilters', this.changeDepartureTimeFilters);
                this.listenTo(this.model, 'change:arrivalTimeFilters', this.changeArrivalTimeFilters);
            }
            this.listenTo(flights.vent, 'uiModel.resultsFetchSuccess.InitialSearch', setInitialState);
            this.listenTo(uiModel, 'responseError.InitialSearch', setInitialState);
            this.listenTo(flights.vent, 'uiModel.resultsFetchFailure.InitialSearch', setInitialState);

            this.render();

            if(Configuration.view.isByot) {
                require(['setupRouter'], function (setupRouter) {
                    self.router = setupRouter();
                });

                this.closeExpandedFiltersOnPageChange();
                this.showTimeFiltersForSelectedLeg();
                this.listenTo(flights.vent, 'router.noSelectedLegs', self.showTimeFiltersForSelectedLeg);
                this.listenTo(flights.vent, 'router.noSelectedLegs', self.closeExpandedFiltersOnPageChange);
                this.listenTo(flights.vent, 'router.selectedLegs', self.showTimeFiltersForSelectedLeg);
                this.listenTo(flights.vent, 'router.selectedLegs', self.closeExpandedFiltersOnPageChange);
                this.listenTo(flights.vent, 'uiModel.resultsFetchSuccess.InitialSearch', self.showTimeFiltersForSelectedLeg);
            }
        },

        closeExpandedFiltersOnPageChange: function (){
            if(this.router.getNextLegToView() === 0 || this.router.getNextLegToView() === 1 ) {
                this.airlineFiltersView.toggle.parameters.isOpened = false;
            }
        },

        showTimeFiltersForSelectedLeg: function(){
            var $outboundDepartureFilters = $('#outbound-departure-times'),
                $outboundArrivalFilters = $('#outbound-arrival-times'),
                $inboundDepartureFilters = $('#inbound-departure-times'),
                $inboundArrivalFilters = $('#inbound-arrival-times');

            if(this.router !== undefined){
                $outboundDepartureFilters.hide();
                $outboundArrivalFilters.hide();
                $inboundDepartureFilters.hide();
                $inboundArrivalFilters.hide();

                if(this.router.getNextLegToView() === 0){
                    $outboundDepartureFilters.show();
                } else if(this.router.getNextLegToView() === 1){
                    $inboundDepartureFilters.show();
                }
            }
        },

        changeArrivalAirportFilters: function () {
            var airports = this.model.get('arrivalAirportFilters');

            this._saveCheckedState('arrivalAirportFilters', false, function(filter, index){
                return 'airportRowContainer_' + filter.airportCode;
            });

            this.arrivalAirportFiltersView.collection.reset(airports);
            this.arrivalAirportFiltersView.collection.set(airports);
        },

        changeStopFilters: function () {
            
            this._saveCheckedState('stopFilters', false, function(filter, index){
                return 'stopFilter_stops-' + index;
            });

            this.stopFiltersView.model.set(this.model.get('stopFilters'));
        },

        changeAirlineFilters: function () {

            this._saveCheckedState('airlineFilters', false, function(filter, index){
                return 'airlineRowContainer_'+filter.airlineCode.replace('/','\\/');
            });

            this.airlineFiltersView.collection.reset(this.model.get('airlineFilters'));
            this.airlineFiltersView.collection.set(this.model.get('airlineFilters'));
        },

        changeDepartureTimeFilters: function () {
            var self = this;

            this._saveCheckedState('departureTimeFilters', true, function(filter, index){
                return 'leg' + index + '-' + filter.filterName.toLowerCase() + '-departure';
            });

            _.each(this.model.get('departureTimeFilters'), function (filterData, index) {
                self.departureTimeFilters[index].model.set(filterData);
            });
        },

        changeArrivalTimeFilters: function () {
            var self = this;

            this._saveCheckedState('arrivalTimeFilters', true, function(filter, index){
                return 'leg' + index + '-' + filter.filterName.toLowerCase() + '-arrival';
            });

            _.each(this.model.get('arrivalTimeFilters'), function (filterData, index) {
                self.arrivalTimeFilters[index].model.set(filterData);
            });
        },

        render: function () {
            var timeFiltersCount = Math.min(this.departureTimeFilters.length, this.arrivalTimeFilters.length),
                i;

            this.$categoriesContainer.empty();

            this.$categoriesContainer.append(this.stopFiltersView.render(true).el);
            this.$categoriesContainer.append(this.airlineFiltersView.render(true).el);

            if (Configuration.route.isMultiDest) {
                return this;
            }

            for (i = 0; i < timeFiltersCount; i++) {
                this.$categoriesContainer.append(this.departureTimeFilters[i].render().el);
                if (!Configuration.route.isOneWay) {
                    this.$categoriesContainer.append(this.arrivalTimeFilters[i].render().el);
                }
            }

            var shouldShowArrivalAirportFilter = Configuration.route.isOneWay || Configuration.view.isByot;
            if (shouldShowArrivalAirportFilter) {
                this.$categoriesContainer.append(this.arrivalAirportFiltersView.render(true).el);
            }

            return this;
        },

        showLoader: function () {
            this.$categoriesContainer.empty();
            this.$loader.show();
        },

        hideLoader: function () {
            this.$loader.hide();
        },

        disable: function () {
            this.$el.find('input[type="checkbox"]').prop('disabled', true);
            $('.sort-bar-column .off-canvas-btn').prop('disabled', true);
        },

        enable: function () {
            this.$el.find('input[type="checkbox"][class!="disabled"]').prop('disabled', false);
            $('.sort-bar-column .off-canvas-btn').prop('disabled', false);
        },

        _saveCheckedState: function(modelProperty, isArray, getCheckboxIdCallback) {

            if(false === shouldSaveCheckedState) {
                return;
            }

            if(isArray){
                _.each(this.model.get(modelProperty), function (filterData, index) {
                    _.each(filterData, function(filter, i){
                        _.extend(filter, {
                            checked: $('#' + getCheckboxIdCallback(filter, index)).is(':checked')
                        });
                    });
                });
            } else {
                _.each(this.model.get(modelProperty), function(filter, index) {
                    _.extend(filter, {
                        checked: $('#' + getCheckboxIdCallback(filter, index)).is(':checked')
                    });
                });
            }
        },

        _getTimeFilterPillStrings: function(timeFilter) {
            return (Configuration.route.isOneWay || Configuration.view.isByot ? timeFilter.singleLeg : timeFilter.multiLeg);
        }

    });

});

/* static_content/default/default/scripts/exp/flights/flux/views/FilterPillsView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('filterPillsView', ['jquery', 'flights', 'handlebars', 'backbone', 'underscore', 'analytics', 'experiments'], function($, flights, handlebars, Backbone, _, analytics, experiments) {
    'use strict';

    return Backbone.View.extend({
        pillTemplate: handlebars.templates.filterPillTemplate,
        el: '#flightSearchResultDiv', //expanded view scope to account for pills in the NFF message
        $activeFilters: $('.active-filters'),
        $pillsList: $('.active-filters ul.filters'),
        events: {
            'click li.filter': 'removeFilter'
        },
        initialize: function (options) {
            var self = this;
            self.model = options.model;
            self.filtersView = options.filtersView;

            self.listenTo(self.model, 'change', self.render);

            flights.vent.on('router.noSelectedLegs router.selectedLegs', function () {
                flights.vent.once('uiModel.resetViewableOffers', function () {
                    self.render.call(self);
                });
            });
        },
        render: function () {
            var self = this;
            var $checkedFilterElements;
            if(experiments.getVariant(12623) > 0) {
            	$checkedFilterElements = $('#filterContainer fieldset:not(#airlines) input:checked');
            } else {
            	$checkedFilterElements =  $('#filterContainer input:checked');
            }
            this.$pillsList.empty();
            if (0 === $checkedFilterElements.length) {
                this.hide();
            } else {
                this.show();
                _.each($checkedFilterElements, function (element) {
                    var $element = $(element),
                        omnitureRfrrSuffix = $element.data('omnitureRfrr').indexOf('.Disable') === -1 ? '.Disable.FilterPill' : '.FilterPill';
                    self.$pillsList.append(self.pillTemplate({
                        name: $element.attr('name'),
                        value: $element.attr('value'),
                        label: $element.data('pillLabel'),
                        omnitureRfrr: $element.data('omnitureRfrr') + omnitureRfrrSuffix
                    }));
                });
            }
        },
        removeFilter: function (event) {
            var $pill = $(event.target).closest('.filter'),
                name = $pill.data('filterName'),
                value = $pill.data('filterValue'),
                checkBox;
            if (false === this.$el.hasClass('disabled')) {
                this.hide();
                this.filtersView.appView.ajaxErrorView.$el.addClass('hide');

                checkBox = $('#filterContainer input[name="' + name + '"][value="' + value + '"]');
                checkBox.attr('checked', false);

                this.filtersView.requestFilteredResults({
                    target: checkBox,
                    currentTarget: {
                        id : checkBox.prop('id')
                    }
                });
            }
            analytics.trackAction($pill.data('omnitureRfrr'), $pill);
        },
        hide: function () {
            this.$activeFilters.hide();
        },
        show: function () {
            this.$activeFilters.show();
        },
        disable: function () {
            this.$el.addClass('disabled');
        },
        enable: function () {
            this.$el.removeClass('disabled');
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/StopFiltersView.js */
/*jslint browser: true, unparam: false, white: true, todo: true, nomen: true */
/*global define, require, console */

define('stopFiltersView',
    ['handlebars', 'filterItemView', 'i18n', 'stopFiltersModel', 'filterItemModel', 'backbone', 'configuration'],
    function(handlebars, FilterItemView, i18n, StopFiltersModel, FilterItemModel, Backbone, configuration) {
        'use strict';

        return Backbone.View.extend({

            id: 'stops',
            tagName: 'fieldset',
            filterType: 'stops',
            className: 'filter-set',
            ariaFilterLegendId: 'stops',
            template: handlebars.templates.filterCategoryTemplate,
            model: new StopFiltersModel(),
            categoryTitle: i18n.filters.stops.categoryTitle,
            showPriceColumn: true,
            minFiltersToShow: 1,

            initialize: function () {
                this.nonStopInputView = new FilterItemView({
                    model: new FilterItemModel(),
                    categoryTitle: i18n.filters.stops.categoryTitle,
                    ariaFilterLegendId: 'stops',
                    filterType: 'stops',
                    label: i18n.filters.stops.nonstop,
                    ariaText: i18n.filters.stops.nonstopAriaText,
                    input: {
                        id: 'stopFilter_stops-0',
                        name: 'fs',
                        value: '0',
                        data: {
                            omnitureRfrr: 'FLT.SR.Filter.Stops.0',
                            pillLabel: i18n.filters.stops.nonstop,
                            interstitialMessage: i18n.filters.interstitial.stops
                        }
                    },
                    showCount: true,
                    showPrice: true,
                    appendLegToName: configuration.view.isByot
                });

                this.oneStopInputView = new FilterItemView({
                    model: new FilterItemModel(),
                    categoryTitle: i18n.filters.stops.categoryTitle,
                    ariaFilterLegendId: 'stops',
                    filterType: 'stops',
                    label: i18n.filters.stops.onestop,
                    ariaText: i18n.filters.stops.onestopAriaText,
                    input: {
                        id: 'stopFilter_stops-1',
                        name: 'fs',
                        value: '1',
                        data: {
                            omnitureRfrr: 'FLT.SR.Filter.Stops.1',
                            pillLabel: i18n.filters.stops.onestop,
                            interstitialMessage: i18n.filters.interstitial.stops
                        }
                    },
                    showCount: true,
                    showPrice: true,
                    appendLegToName: configuration.view.isByot
                });

                this.twoStopInputView = new FilterItemView({
                    model: new FilterItemModel(),
                    categoryTitle: i18n.filters.stops.categoryTitle,
                    ariaFilterLegendId: 'stops',
                    filterType: 'stops',
                    label: i18n.filters.stops.variableStops.replace('{0}', '2+').replace('\\{0\\}', '2+'),
                    ariaText: i18n.filters.stops.twostopAriaText,
                    input: {
                        id: 'stopFilter_stops-2',
                        name: 'fs',
                        value: '2',
                        data: {
                            omnitureRfrr: 'FLT.SR.Filter.Stops.2+',
                            pillLabel: i18n.filters.stops.variableStops.replace('{0}', '2+').replace('\\{0\\}', '2+'),
                            interstitialMessage: i18n.filters.interstitial.stops
                        }
                    },
                    showCount: true,
                    showPrice: true,
                    appendLegToName: configuration.view.isByot
                });

                this.listenTo(this.model, 'change:0', this.changeNonStopModel);
                this.listenTo(this.model, 'change:1', this.changeOneStopModel);
                this.listenTo(this.model, 'change:2', this.changeTwoStopModel);
                this.render(true);
            },

            changeNonStopModel: function () {
                this.nonStopInputView.model.set(this.model.get('0'));
                this.render();
            },

            changeOneStopModel: function () {
                this.oneStopInputView.model.set(this.model.get('1'));
                this.render();
            },

            changeTwoStopModel: function () {
                this.twoStopInputView.model.set(this.model.get('2'));
                this.render();
            },

            render: function (initialRender) {

                if(initialRender){ return this; }

                this.$el.html(this.template({
                    ariaFilterLegendId: this.ariaFilterLegendId,
                    categoryTitle: this.categoryTitle,
                    showPriceColumn: this.showPriceColumn
                }));

                this.$el.append(this.nonStopInputView.render().el);
                this.$el.append(this.oneStopInputView.render().el);
                this.$el.append(this.twoStopInputView.render().el);

                return this;
            }

        });

    });
/* static_content/default/default/scripts/exp/flights/flux/views/AirlineFiltersView.js */
/*jslint browser: true, unparam: false, white: true, todo: true, nomen: true */
/*global define, require, console */

define('airlineFiltersView',
       ['handlebars', 'i18n', 'airlineFiltersCollection', 'filterItemView', 'filterItemModel', 'toggleView', 'configuration', 'backbone', 'underscore', 'experiments', 'jquery','analytics', 'flights'],
       function(handlebars, i18n, AirlineFiltersCollection, FilterItemView, FilterItemModel, ToggleView, Configuration, Backbone, _, experiments, $, analytics, flights) {
    'use strict';

    var itemViews = [];

    return Backbone.View.extend({
        id: 'airlines',
        tagName: 'fieldset',
        filterType: 'airlines',
        className: 'filter-set',
        omnitureRfrr: 'FLT.SR.Filter.Airlines',
        ariaFilterLegendId: 'airlines-included',
        collection: new AirlineFiltersCollection(),
        categoryTemplate: handlebars.templates.filterCategoryTemplate,
        categoryTitle: i18n.filters.airlines.categoryTitle,
        showPriceColumn: true,
        minFiltersToShow: 1,
        toggle: {
            filtersToShow: Configuration.filters.numAirlinesToShow,
            parameters: {
                omnitureRfrr: 'Filter.Airlines',
                contentId: 'airlineToggleContainer',
                paneTag: 'span',
                id: 'airlineToggleLink',
                expandText: i18n.filters.airlines.toggle.expandText,
                expandAriaText: i18n.filters.airlines.toggle.expandAriaText,
                collapseText: i18n.filters.airlines.toggle.collapseText,
                collapseAriaText: i18n.filters.airlines.toggle.collapseAriaText,
                isOpened: false
            }
        },

        events: {
            'click .toggle-trigger': 'updateToggle',
            'change input[id^=airlineRowContainer]': 'setStateOfSelectAllCheckbox',
            'change #select-all-airline': 'toggleAllCheckboxState'
        },

        updateToggle: function(){
            this.toggle.parameters.isOpened = !this.toggle.parameters.isOpened;
        },

        initialize: function () {
            this.listenTo(this.collection, 'reset', this.resetViews);
            this.listenTo(this.collection, 'add', this.addView);
            this.selectAllState = false;
            this.selectAllStateV2 = false;
            flights.vent.on('filtersView.summaryUpdated', this.selectAllCheckboxes, this);
        },

        addView: function (model) {
            var airlineCode = model.get('airlineCode'),
                filterName = model.get('filterName'),
                omnitureRfrr = 'FLT.SR.Filter.Airlines';

            if(model.get('checked')){
                omnitureRfrr += '.Disable';
            }

            itemViews.push(new FilterItemView({
                model: new FilterItemModel(model.attributes),
                ariaFilterLegendId: this.ariaFilterLegendId,
                categoryTitle: this.categoryTitle,
                filterType: this.filterType,
                label: filterName,
                ariaText: i18n.filters.airlines.ariaText.replace('{0}', model.get('count')).replace('{1}', filterName).replace('{2}', model.get('formattedPrice')),
                input: {
                    id: 'airlineRowContainer_' + airlineCode,
                    name: 'fa',
                    value: airlineCode,
                    data: {
                        omnitureRfrr: omnitureRfrr,
                        pillLabel: filterName,
                        interstitialMessage: i18n.filters.interstitial.airline
                    }
                },
                showCount: true,
                showPrice: true,
                appendLegToName: Configuration.view.isByot
            }));
            if (!Configuration.filters.showAirlines) {
                return;
            }
            this.render();
        },

        resetViews: function () {
            itemViews = [];
        },

        getItemViews: function(){
            return itemViews;
        },

        render: function (initialRender) {

            if(initialRender){ return this; }

            var self = this;

            this.$el.html(this.categoryTemplate({
                'ariaFilterLegendId': this.ariaFilterLegendId,
                'categoryTitle': this.categoryTitle,
                'showPriceColumn': this.showPriceColumn
            }));

            _.each(itemViews, function (view, index) {
                // Need to fire the change event to make the checkbox append the leg information in its name attribute
                view.model.trigger('change');

                if (index < self.toggle.filtersToShow) {
                    self.$el.append(view.render().el);
                } else {
                    if (self.$el.find('#' + self.toggle.parameters.contentId).length === 0) {
                        self.toggleView = new ToggleView({parameters: self.toggle.parameters});
                        self.$el.append(self.toggleView.render().el);
                    }
                    self.toggleView.appendMarkupToContainer(view.render().el);
                }
            });

            this.populateSelectAllforAirlineFilter();
            return this;
        },
        
        populateSelectAllforAirlineFilter: function () {
	        if(experiments.getVariant(12623) > 0) {
	            if($('#airlines') && $('#airline-included-select-all').length == 0){
	            	experiments.execute('GROFSRAirlineFiltersSelectAll', {});
	            }
	            $('#select-all-airline').prop('checked',this.selectAllState);
	        }
        },
        
        toggleAllCheckboxState: function (event) {
        	this.selectAllState = $('#select-all-airline').prop('checked');
        	$('#airlines input[type=checkbox]').prop('checked', $('#select-all-airline').prop('checked'));
        	if($('#select-all-airline').prop('checked')) {
        		analytics.trackAction('FLT.SR.Filter.SelectAll', this);
        	}
        },

        selectAllCheckboxes: function () {
            var isRenderingFirstTimeForV2 = (experiments.getVariant(12623) == 2) && !this.selectAllStateV2;
            if(isRenderingFirstTimeForV2) {
            	$('#airlines input[type=checkbox]').prop('checked', true);
            	this.selectAllStateV2 = true;
            	this.selectAllState  = true;
            }
    	},

        setStateOfSelectAllCheckbox: function (event) {
        	var allAirlinesChecked = event.target.checked && ($('#airlines input[id^=airlineRowContainer]:checked').length == $('#airlines input[id^=airlineRowContainer]').length);
        	if(experiments.getVariant(12623) > 0) {
        		$('#select-all-airline').prop('checked', allAirlinesChecked);
        		this.selectAllState  = allAirlinesChecked;
        	}
        }

    });

});

/* static_content/default/default/scripts/exp/flights/flux/views/AirportFiltersView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('airportFiltersView', ['handlebars', 'i18n', 'airportFiltersCollection', 'filterItemView', 'filterItemModel', 'configuration', 'backbone', 'underscore', 'experiments'],
        function(handlebars, i18n, AirportFiltersCollection, FilterItemView, FilterItemModel, Configuration, Backbone, _, experiments) {
    'use strict';

    return Backbone.View.extend({
        tagName: 'fieldset',
        className: 'filter-set',
        filterType: 'airports',
        ariaFilterLegendId: 'airports-included',
        categoryTitle: i18n.filters.airports.categoryTitle,
        categoryTemplate: handlebars.templates.filterCategoryTemplate,
        collection: new AirportFiltersCollection(),
        showPriceColumn: true,
        minFiltersToShow: 2,
        itemViews: [],

        initialize: function (options) {
            this.leg = options.leg;
            this.isArrival = options.isArrival;
            this.listenTo(this.collection, 'reset', this.resetViews);
            this.listenTo(this.collection, 'add', this.addView);
            this.render(true);
        },

        addView: function (model) {
            var filterName = model.get('filterName'),
                airportCode = model.get('airportCode'),
                omnitureRfrr = 'FLT.SR.Filter.Airports';

            if (experiments.getVariant(13331) > 0) {
                omnitureRfrr = 'FLT.SR.Filter.Airports.Arrival';
            }

            if(model.get('checked')){
                omnitureRfrr += '.Disable';
            }

            this.itemViews.push(new FilterItemView ({
                model: new FilterItemModel(model.attributes),
                ariaFilterLegendId: this.ariaFilterLegendId,
                categoryTitle: this.categoryTitle,
                filterType: this.filterType,
                label: filterName,
                ariaText: i18n.filters.airports.ariaText.replace('{0}', model.get('count')).replace('{1}', model.get('formattedPrice')),
                showCount: true,
                input: {
                    id: 'airportRowContainer_'+ airportCode,
                    name: (this.isArrival ? 'fad' : 'fao') + this.leg,
                    value: airportCode,
                    data: {
                        omnitureRfrr: omnitureRfrr,
                        pillLabel: filterName,
                        interstitialMessage: i18n.filters.interstitial.generic
                    }
                },
                appendLegToName: Configuration.view.isByot
            }));
            this.render();
        },

        resetViews: function () {
            this.itemViews = [];
            this.render();
        },

        render: function (initialRender) {
            var self = this;
            self.$el.hide().attr('aria-hidden', true);

            if (initialRender) {
                return self;
            }
            if(self.minFiltersToShow <= self.itemViews.length) {
                self.$el.html(self.categoryTemplate({
                    'ariaFilterLegendId': self.ariaFilterLegendId,
                    'categoryTitle': self.categoryTitle,
                    'showPriceColumn': self.showPriceColumn
                }));
                _.each(self.itemViews, function (view) {
                    self.$el.append(view.render().el);
                });
                self.$el.show().attr('aria-hidden', false);
            }
            return self;
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/TimeFiltersView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('timeFiltersView',
       ['handlebars', 'filterItemView', 'filterItemModel', 'toggleView', 'backbone'],
       function(handlebars, FilterItemView, FilterItemModel, ToggleView, Backbone) {
    'use strict';

    //TODO rbalakrishnan markup should be obtained all the time; invalid filters should be greyout out
    function getMarkup(view) {
        if (view instanceof Backbone.View) {
            return view.render().el;
        }
        return '';
    }

    function updateModel (view, model) {
        if ('object' === typeof model && view instanceof Backbone.View) {
            view.model.set(model);
        }
    }

    return Backbone.View.extend({
        tagName: 'fieldset',
        className: 'filter-set',
        filterType: 'flight-time',
        ariaFilterLegendId: 'flight-time',
        categoryTemplate: handlebars.templates.filterCategoryTemplate,
        showPriceColumn: false,
        minFiltersToShow: 1,

        events: {
            'click .toggle-trigger': 'updateToggle'
        },

        updateToggle: function(){
            this.toggleParameters.isOpened = !this.toggleParameters.isOpened;
        },

        initialize: function (options) {
            this.categoryTitle = options.configuration.categoryTitle;
            this.toggleParameters = options.configuration.toggleParameters;
            this.ariaFilterLegendId += ('-' + options.id);

            this.earlyMorningInputView = new FilterItemView({
                model: new FilterItemModel(),
                categoryId: options.id,
                ariaFilterLegendId:'flight-time-' + options.id,
                filterType: 'flight-time',
                label: options.configuration.earlyMorning.label,
                input: options.configuration.earlyMorning.input,
                showCount: false,
                showPrice: false
            });

            this.morningInputView = new FilterItemView({
                model: new FilterItemModel(),
                categoryId: options.id,
                ariaFilterLegendId:'flight-time-' + options.id,
                filterType: 'flight-time',
                label: options.configuration.morning.label,
                input: options.configuration.morning.input,
                showCount: false,
                showPrice: false
            });

            this.afternoonInputView = new FilterItemView({
                model: new FilterItemModel(),
                categoryId: options.id,
                ariaFilterLegendId:'flight-time-' + options.id,
                filterType: 'flight-time',
                label: options.configuration.afternoon.label,
                input: options.configuration.afternoon.input,
                showCount: false,
                showPrice: false
            });

            this.eveningInputView = new FilterItemView({
                model: new FilterItemModel(),
                categoryId: options.id,
                ariaFilterLegendId:'flight-time-' + options.id,
                filterType: 'flight-time',
                label: options.configuration.evening.label,
                input: options.configuration.evening.input,
                showCount: false,
                showPrice: false
            });

            this.listenTo(this.model, 'change', this.changeModels);
        },

        _foreachView: function (callback) {
            var views = [this.earlyMorningInputView, this.morningInputView, this.afternoonInputView, this.eveningInputView];

            _.each(views, function(view){
                callback(view);
            });

        },

        changeModels: function () {
            var models = {};

            _.each(this.model.toJSON(), function (value, key) {
                var name = value.filterName;
                if ('string' === typeof name) {
                    models[value.filterName.toLowerCase()] = value;
                }
            });

            updateModel(this.earlyMorningInputView, models.earlymorning);
            updateModel(this.morningInputView, models.morning);
            updateModel(this.afternoonInputView, models.afternoon);
            updateModel(this.eveningInputView, models.evening);

            this.render();
        },

        render: function () {
            var self = this,
                filterCount = 0,
                categoryMarkup,
                toggleView;

            this._foreachView(function(view){
                filterCount += view.model.get('totalCount') >= 1 ? 1 : 0;
            });

            if (this.minFiltersToShow <= filterCount) {
                categoryMarkup = this.categoryTemplate({
                    'ariaFilterLegendId': this.ariaFilterLegendId,
                    'categoryTitle':this.categoryTitle,
                    'showPriceColumn':this.showPriceColumn
                });
                if ('object' === typeof this.toggleParameters && this.toggleParameters.useToggle === true) {
                    toggleView = new ToggleView({parameters: _.extend({}, this.toggleParameters)});
                    this.$el.html(toggleView.render().el);
                    toggleView.appendMarkupToContainer(categoryMarkup);

                    this._foreachView(function(view){
                        toggleView.appendMarkupToContainer(getMarkup(view));
                    });

                } else {
                    this.$el.html(categoryMarkup);
                    this.$el.addClass('always-shown').html(categoryMarkup);
                    this._foreachView(function(view){
                        self.$el.append(getMarkup(view));
                    });
                }
            }

            return this;
        }

    });

});

/* static_content/default/default/scripts/exp/flights/flux/views/PaginationView.js */
/*jslint nomen:true, browser: true, unparam: true, white: true, todo: true */
/*global define, _, require, console */

define('paginationView',
    ['flights', 'jquery', 'handlebars', 'analytics', 'uitk', 'i18n', 'configuration', 'backbone', 'paginationModel'],
    function(flights, $, handlebars, analytics, uitk, i18n, Configuration, Backbone, PaginationModel) {

    'use strict';

    var previouslyDisabledElements;

    return Backbone.View.extend({

        tagName: 'div',

        template: handlebars.templates.pagination,

        render: function () {
            var jsonModel, markup;
            jsonModel = this.model.toJSON();
            delete jsonModel.currentPageNumber;
            markup = this.template(jsonModel);
            this.$el = $(markup);
            this.$el.insertAfter(this.appView.offersCollectionView.$el);
            this.$el.uitk_pagination();
            return this;
        },

        fetchOrigin: 'Pagination',

        getAjaxData: function(isInitialSearch, forceGet){
            if(!forceGet && (false === Configuration.pagination.enabled || isInitialSearch)){ return {}; }

            return {
                cz: this.model.defaults.numberOfResultsPerPage
            };
        },

        clear: function () {
            if (this.$el && this.$el.length > 0) {
                this.$el.remove();
            }
        },

        reset: function() {
            this.clear();
            this.render();
        },

        subscribeToClickEventsAndReportPagination: function (self) {
            var bodyElement = $('body');
            bodyElement.on(uitk.clickEvent, '.pagination-next', function () {
                analytics.trackAction('FLT.SR.Pagination.NextPage', $(this), {prop1: self.model.get('totalNumberOfResults')});
                analytics.trackAction('FLT.SR.Pagination.Page.' + (self.model.get('currentPageNumber')), $(this), {prop1: self.model.get('totalNumberOfResults')});
            });

            bodyElement.on(uitk.clickEvent, '.pagination-prev', function () {
                analytics.trackAction('FLT.SR.Pagination.PreviousPage', $(this), {prop1: self.model.get('totalNumberOfResults')});
                analytics.trackAction('FLT.SR.Pagination.Page.' + (self.model.get('currentPageNumber')), $(this), {prop1: self.model.get('totalNumberOfResults')});
            });

            bodyElement.on(uitk.clickEvent, '.backToTop', function () {
                analytics.trackAction('FLT.SR.Pagination.TopOfPage', $(this), {prop1: self.model.get('totalNumberOfResults')});
            });
            bodyElement.on(uitk.clickEvent, 'button.pagination-label', function () {
                var changedPage, lastPage, showFirstAndLast;
                analytics.trackAction('FLT.SR.Pagination.Page.' + $(this).val(), $(this), {prop1: self.model.get('totalNumberOfResults')});

                changedPage = parseInt($(this).val(), 10);
                lastPage = Math.ceil(self.model.get('totalNumberOfResults') / self.model.get('numberOfResultsPerPage'));
                showFirstAndLast = $('#paginationControl').data('show-always-first-last');

                if (changedPage === lastPage) {
                    analytics.trackAction('FLT.SR.Pagination.Page.Last', $(this), {
                        prop1: lastPage,
                        prop2: showFirstAndLast ? 'showFirstAndLastEnabled' : 'showFirstAndLastDisabled'
                    });
                }
            });
        },
        updateUiAndModel: function (self, data) {
            window.scrollTo(0, 0);
            self.lastPageNumber = data.pageNumber - 1;
            uitk.utils.liveAnnounce(i18n.paging.accessibility.searchingForPage.replace('{0}', data.pageNumber), 'polite');
            self.model.set({
                currentPageNumber: data.pageNumber,
                currentFirstResult: (data.pageNumber - 1) * Configuration.pagination.numOffersPerPage + 1
            });
        },
        disableViewMethodsWhenPaginationIsDisabled: function (self) {

            $('#paginationControl').hide();

            // Disable view methods when pagination is disabled.
            //assign to reference of noop
            self.show = $.noop;
            self.hide = $.noop;
            self.disable = $.noop;
            self.enable = $.noop;
            self.reset = $.noop;
            self.render = function () {
                return this;
            };

            self.listenTo(self.appView.model, 'change:offers', function (model) {
                self.model.set({'numberOfResultsPerPage': _.keys(model.get('offers')).length});
            });

        },
        initialize: function (options) {
            var self = this;

            self.appView = options.appView;

            this.model = options.model || new PaginationModel();

            if (true === Configuration.pagination.enabled) {

                uitk.subscribe('pagination.pageChanged', function(topic, data) {
                    self.updateUiAndModel(self, data);
                });

                this.subscribeToClickEventsAndReportPagination(self);
                this.listenToOnce(this.model, 'change', this.reset);
                this.listenTo(flights.vent, 'uiModel.resultsFetchSuccess', this.updateTotalFilteredResults);
                this.listenTo(flights.vent, 'uiModel.fetching', this.hide);
                flights.vent.once('uiModel.resultsFetchSuccess.' + self.fetchOrigin, function() {
                    uitk.utils.liveAnnounce(i18n.paging.accessibility.searchingResultsNowOnPage.replace('{0}', self.model.get('currentPageNumber')));
                });

            } else {
                this.disableViewMethodsWhenPaginationIsDisabled(self);
            }

        },
        updateTotalFilteredResults: function(resultsData) {
            var totalNumberOfResults = resultsData.response.content.filteredCount;
            if(0 === totalNumberOfResults) {
                this.clear();
                return;
            }
            this.model.set('totalNumberOfResults', totalNumberOfResults);
            this.reset();
        },

        show: function(){
            $('#paginationControl').show();
        },

        hide: function(){
            $('#paginationControl').hide();
        },

        disable: function () {
            var $context = $('#paginationControl');
            previouslyDisabledElements = $context.find('button:disabled');
            $context.find('button').attr('disabled','disabled');
        },

        enable: function () {
            var $context = $('#paginationControl');
            $context.find('button').removeAttr('disabled');
            if( previouslyDisabledElements instanceof $ ){
                previouslyDisabledElements.attr('disabled', 'disabled');
            }
        }
    });
});

/* static_content/default/default/scripts/exp/flights/flux/views/AjaxErrorView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('ajaxErrorView', ['flights', 'jquery', 'underscore', 'dctk/dctk', 'uitk', 'handlebars', 'analytics', 'ajaxErrorModel', 'i18n', 'backbone', 'pageCriteriaModel', 'configuration', 'sitebrand'],
    function(flights, $, _, dctk, uitk, handlebars, analytics, ajaxErrorModel, i18n, Backbone, pageCriteriaModel, configuration, sitebrand) {
    'use strict';

    function logError(errStatus, logData){
        logData.push('errorSrc=FLUX.' + errStatus);
        dctk.loggingAdapter.logMessage('ajax' + errStatus, logData);
    }

    return Backbone.View.extend({

        model: ajaxErrorModel,

        templates: {
            filtersNoFlightsFound: handlebars.templates.filtersNoFlightsFoundTemplate,
            noFlightsFound: handlebars.templates.noFlightsFound,
            timeout: handlebars.templates.timeoutError,
            unknownError: handlebars.templates.genericError,
            multiItemError: handlebars.templates.multiItemErrorTemplate
        },

        prop36: {
            filtersNoFlightsFound: 'FLT.SR.NoFlightsAvailable.Filter',
            noFlightsFound: 'FLT.SR.NoFlightsAvailable',
            timeout: function(origin){
                return 'FLT.SR.' + origin + '.TimeoutError';
            },
            unknownError: 'FLT.SR.FlightSearchError'
        },

        events: {
            'click .try-again': 'tryAgain'
        },

        hide: function(){
            this.$el.addClass('hide');
        },

        tryAgain: function(){
            this.hide();
            uitk.utils.liveAnnounce(i18n.searching.accessibility.searchRetry, 'polite');

            pageCriteriaModel.set('interstitialMessage', i18n.searching.interstitial.retry, { silent: true }).trigger('change');

        },

        render: function () {
            var $loader = $('#columnAFilter .filtersLoaderContainer'),
                errorCodes = this.model.ERROR_CODES,
                failingProduct = this.model.FAILING_PRODUCT,
                totalModules = ((flights.collections && flights.collections.offersCollection) && flights.collections.offersCollection.length) || 0,
                useMultiItemError = (flights.Model && flights.Model.Wizard) && flights.Model.Wizard.packageType === 'fhc',
                errStatus = this.model.get('errorStatus') || '',
                logData = this.model.get('logData') || [],
                options = this.model.get('options'),
                logMessage = 'No Flights Found',
                markup,
                extraMessage = '',
                omnitureRfrr = '',
                fetchOrigin,
                eventNameItem,
                eventName,
                hasEventName,
                eventItemsFound;

            if (errStatus === ''){
                this.$el.addClass('hide');
                return;
            }

            fetchOrigin = pageCriteriaModel.get('fetchOrigin');

            this.appView.offersCollectionView.$el.empty();

            if (errStatus === errorCodes.NO_FLIGHTS_FOUND){

                if('Filter' === fetchOrigin){

                    markup = $(this.templates.filtersNoFlightsFound());
                    if(this.appView.selectedFiltersView !== undefined) {
                        markup.find('#applied-filters').html(this.appView.selectedFiltersView.$el.clone(true));
                    } else {
                        markup.find('#applied-filters').html($('.active-filters .filters').clone(true));
                    }
                    logMessage = errorCodes.NO_FLIGHTS_FOUND + ' Filtered ' + logMessage;
                    omnitureRfrr = this.prop36.filtersNoFlightsFound;

                } else {

                    markup = this.templates.noFlightsFound(this.generateNoFlightsFoundTemplateData());
                    logMessage = errorCodes.NO_FLIGHTS_FOUND + ' ' + logMessage;
                    omnitureRfrr = this.prop36.noFlightsFound;
                }

            } else if (errStatus === errorCodes.TIMEOUT) {

                markup = this.templates.timeout({origin: options.origin});
                logMessage = errorCodes.TIMEOUT + ' ' + logMessage;
                extraMessage = i18n.error.accessibility.timeoutRetry;
                omnitureRfrr = this.prop36.timeout(options.origin);

            } else { // All other unknown events

                if (useMultiItemError) {

                    markup = this.templates.multiItemError({failingProduct: failingProduct[errStatus]});
                    errStatus = errorCodes.MIS_ERROR;

                } else {

                    markup = this.templates.unknownError();
                    errStatus = errorCodes.UNKNOWN_ERROR;

                }

                eventItemsFound = $.grep(logData, function (value, index) {
                    var containsEventName = (-1 < value.toLowerCase().indexOf('eventname'));
                    return containsEventName;
                });

                hasEventName = 0 < eventItemsFound.length;

                eventNameItem = (true === hasEventName) ? eventItemsFound[0] : ('eventName=' + this.prop36.unknownError);
                eventName = eventNameItem.split('=')[1];

                logMessage = errStatus + ' ' + logMessage;
                omnitureRfrr = eventName;
            }

            _.defer(function () {
              analytics.updateOmnitureProperty('prop36', omnitureRfrr);
              analytics.trackPageLoad();
            });

            logError(errStatus, logData);

            $loader.hide();

            this.$el.html(markup).removeClass('hide');
            this.appView.paginationView.hide();

            uitk.utils.liveAnnounce($(markup).find('.announce-able').text() + ' ' + extraMessage);

            flights.log(logMessage + ': totalModules = ' + totalModules);

            return this;
        },

        generateNoFlightsFoundMessage: function () {
            var wizardModel = flights.Model.Wizard,
                searchedXAirlinesNoFlightsLocId = 'searchedXAirlinesNo',
                isFirstClass = wizardModel.seatingClass === '1',
                isBusiness = wizardModel.seatingClass === '2',
                isPremiumEconomy = wizardModel.seatingClass === '5';

            if (wizardModel.nonStop) {
                searchedXAirlinesNoFlightsLocId += 'NonStop';
            }
            if (wizardModel.refundable) {
                searchedXAirlinesNoFlightsLocId += 'Refundable';
            }
            if (wizardModel.preferredAirline) {
                searchedXAirlinesNoFlightsLocId += 'PreferredAirline';
            }
            if (isFirstClass || isBusiness || isPremiumEconomy) {
                searchedXAirlinesNoFlightsLocId += 'PreferredCabin';
            }
            if (configuration.route.isMultiDest) {
                searchedXAirlinesNoFlightsLocId += 'FlightsForCurrentSearch';
            } else {
                searchedXAirlinesNoFlightsLocId += 'WithAirports';
            }

            return searchedXAirlinesNoFlightsLocId;
        },

        generateNoFlightsFoundTemplateData: function () {
            var wizardModel = flights.Model.Wizard,
                singlePageModel = this.appView.singlePageModel,
                seatingClass,
                preferredAirline = _.find(wizardModel.airlines, function (airline) {
                    return airline.code === wizardModel.preferredAirline;
                });

            if (wizardModel.seatingClass === '1') {
                seatingClass = 'firstClass';
            } else if (wizardModel.seatingClass === '2') {
                seatingClass = 'businessClass';
            } else if (wizardModel.seatingClass === '5') {
                seatingClass = 'premiumEconomyClass';
            }

            return {
                noFlightsFoundMessage: this.generateNoFlightsFoundMessage(),
                arrivalLocationCode: singlePageModel.get('arrivalAirportCode'),
                arrivalCityName: singlePageModel.get('arrivalCity'),
                departureLocationCode: singlePageModel.get('departureAirportCode'),
                departureCityName: singlePageModel.get('departureCity'),
                departureDate: singlePageModel.get('departureDateStr'),
                isAirAsiaGo: sitebrand.brandname === 'AirAsiaGo',
                preferredAirlineName: wizardModel.preferredAirline && preferredAirline.name,
                numberOfAirlines: configuration.noFlightsFoundError.numberOfAirlines,
                removePreferencesURL: configuration.noFlightsFoundError.removePreferencesURL,
                seatingClass: seatingClass
            };
        },

        initialize: function (options) {
            var self = this;

            self.appView = options.appView;

            self.setElement($('#ajax-error'));

            uitk.subscribe('pagination.pageChanged', function(){
                self.hide();
            });

            this.listenTo(this.model, 'change', this.render);
        }

    });
});

/* static_content/default/default/scripts/exp/flights/flux/views/SortBarView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('sortBarView', ['flights', 'jquery', 'uitk', 'analytics', 'i18n', 'configuration', 'backbone', 'sortBarModel', 'uiModel', 'pageCriteriaModel'],
    function(flights, $, uitk, analytics, i18n, Configuration, Backbone, SortBarModel, uiModel, pageCriteriaModel) {

        'use strict';

        var parameterTranslation = {
            price: 'sp',
            duration: 'st',
            departuretime: 'sd',
            leg0departuretime: 'sd0',
            leg1departuretime: 'sd1',
            arrivaltime: 'sa',
            leg0arrivaltime: 'sa0',
            leg1arrivaltime: 'sa1',
            stops: 'st'
        },
        currentLeg;

        function hackTheAColFilterButton(){
            var $context = $('#sortBar').find('.sort-bar-column button')
                , $textContext = $context.find('.visuallyhidden')
                , buttonText = $textContext.text();

            $textContext.text(' ' + buttonText);
            $textContext.removeClass('visuallyhidden');

            $context
                .addClass('btn-primary btn-sub-action')
                .removeClass('btn-secondary btn-utility');
        }

        function clearAllSortClasses($el){
            $.each(parameterTranslation, function(uiCode, serverCode){
                $el.removeClass(uiCode + '-sort');
            });
        }

        return Backbone.View.extend({

            sortType: 'sp',
            sortDirection: 'asc',

            fetchOrigin: 'Sort',

            initialize: function (options) {
                var self = this;

                self.appView = options.appView;

                self.setElement($('#sortBar'));

                self.hideSortByText();

                hackTheAColFilterButton(); // TODO: Add unit tests

                currentLeg = undefined;

                self.listenTo(pageCriteriaModel, 'change', self.disable);
                self.listenTo(uiModel.viewableOffers, 'reset', self.enable);
                self.listenTo(uiModel, 'noFlightsFound', self.disable);

                self.model = options.model || new SortBarModel();

                if(Configuration.view.isByot) {
                    this.listenTo(flights.vent, 'router.noSelectedLegs', self.resetToDefaultSort);
                    this.listenTo(flights.vent, 'router.selectedLegs', self.resetToDefaultSort);

                }
            },

            events: {
                'change select': 'requestSortedResults'
            },

            hideSortByText: function () {
                if (this.$el.hasClass('no-label')) {
                    this.$el.removeClass('no-label')
                        .find('.inline-label').addClass('visuallyhidden');
                }
            },

            getAjaxData: function(){
                var data = {};

                data[this.sortType] = this.sortDirection;

                return data;
            },

            requestSortedResults: function () {
                var self = this
                    , selectedSortValue = self.$el.find('select').val()
                    , $selectedOption = self.$el.find('select option:selected')
                    , selectedSortText = $selectedOption.text()
                    , omnitureReferrerId = $selectedOption.data('omnitureRfrr')
                    , interstitialMessage = $selectedOption.data('interstitialMessage') || i18n.sorting.interstitial.generic
                    , sortData = selectedSortValue.split(':')
                    , sortType = sortData[0]
                    , sortDirection = sortData[1];

                self.sortType = parameterTranslation[sortType];
                self.sortDirection = sortDirection;

                clearAllSortClasses(self.appView.offersCollectionView.$el);

                analytics.trackAction(omnitureReferrerId, $selectedOption);

                uitk.utils.liveAnnounce(i18n.sorting.accessibility.sortingStart.replace('{0}', selectedSortText), 'polite');

                flights.vent.once('uiModel.resetViewableOffers', function(){
                    var sortingEndAnnouncement = i18n.sorting.accessibility.sortingEnd;

                    if (Configuration.view.isByot) {
                        require(['setupRouter'], function (setupRouter) {
                            currentLeg = setupRouter().getCurrentFragment() === '' ? 0 : 1;
                        });
                    }

                    if(currentLeg === 0) {
                        sortingEndAnnouncement = i18n.sorting.accessibility.announceDeparturePage;
                    }

                    if(currentLeg === 1){
                        sortingEndAnnouncement = i18n.sorting.accessibility.announceReturnPage;
                    }

                    uitk.utils.liveAnnounce(sortingEndAnnouncement.replace('{0}', selectedSortText), 'polite');

                    self.appView.offersCollectionView.$el.addClass(sortType + '-sort');
                });

                self.model.set({
                    interstitialMessage: interstitialMessage,
                    type: self.sortType,
                    direction: self.sortDirection
                });
            },

            disable: function () {
                this.$el.find('select').attr('disabled', 'disabled');
            },

            disableOffCanvasToggle: function () {
                this.$el.find('.sort-bar-column button').attr('disabled', 'disabled');
            },

            enable: function () {
                this.$el.find('select').removeAttr('disabled');
            },

            enableOffCanvasToggle: function () {
                this.$el.find('.sort-bar-column button').removeAttr('disabled');
            },

            resetToDefaultSort: function(){
                var self = this,
                    defaultSortClass = 'price-sort';

                self.$el.find('option:selected').prop('selected', false);
                self.$el.find('option:first').prop('selected', 'selected');

                self.model.clear({silent: true}).set(self.model.defaults, {silent: true});

                self.sortType = self.model.get('type');
                self.sortDirection = self.model.get('direction');

                clearAllSortClasses(self.appView.offersCollectionView.$el);

                flights.vent.once('uiModel.resultsFetchSuccess', function(){
                    self.appView.offersCollectionView.$el.addClass(defaultSortClass);
                });
            }

        });

    });
/* static_content/default/default/scripts/exp/flights/flux/views/StaleDataModalView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('staleDataModalView', ['jquery', 'uitk', 'analytics', 'i18n', 'backbone'], function($, uitk, analytics, i18n, Backbone) {

    'use strict';

    function changeButtonText($button) {
        $button.find('.btn-label').text(i18n.sessionmodal.refreshSearch);
    }

    function addOmnitureInformationToButton($button) {
        $button.attr({
            'data-omniture-rfrr': 'SessionTimeout.Refresh',
            'data-click-handler': 'omnitureClickHandler'
        });
    }

    function addClickHandlerToButton($button, modal, view) {
        $button.click(function () {
            modal.modalWrap.hide();
            view.reloadStartUrl();
        });
    }

    return Backbone.View.extend({

        initialize: function () {
            var self = this;
            uitk.subscribe('modal.appended', function(topic, modal) {
                if ($(modal.modalHtml).attr('id') === 'modalSessionExpiredModalContent') {
                    self.handleSessionExpiredPopupTabbing();
                }
            });

            self.listenTo(self.model, 'stale', self.renderModal);
            self.listenTo(self.model, 'stale', function(){
                window.isStaleModeEnabled = true;
            });
        },

        reloadStartUrl: function () {
            var redirectUrl = $('#sessionExpiredModalContent').data('researchurl'),
                urlSegments = window.location.href.split('#');// Reload the page without the hash tags.
            if(!redirectUrl) {
                redirectUrl = urlSegments[0];
            }
            window.location.href = redirectUrl;
        },

        renderModal: function () {
            var $modalButton,
                modalOptions = {
                    content: 'sessionExpiredModalContent',
                    modalId: 'modalSessionExpiredModalContent',
                    title: i18n.sessionmodal.countdownModalTimer,
                    dataAttributes: 'click-handler:sessionExpiredModal',
                    classes: 'click-handler-range',
                    footer: true,
                    dismiss: false,
                    ajax: false
                },
                modal;

            uitk.modal.close();

            modal = uitk.modal.create(modalOptions);
            analytics.updateOmnitureProperty('prop16', 'FLT.SR.SessionTimeout');
            analytics.trackAction('FLT.SR.SessionTimeout', $('#modalSessionExpiredModalContent'));

            $modalButton = modal.modalWrap.find('.modal-footer .modal-close');

            addOmnitureInformationToButton($modalButton);
            changeButtonText($modalButton);
            addClickHandlerToButton($modalButton, modal, this);

            return modal;
        },

        handleSessionExpiredPopupTabbing: function () {
            setTimeout( function() {
                var $modalButton,
                    $titleText;
                if ( $('.modal-wrap .modal-body').length > 0) {
                    $modalButton = $('#footerModalCloseButton');
                    $titleText = $('#modalSessionExpiredModalContent-title');
                    $titleText.focus();
                    // forward tabbing...
                    $modalButton.on('keydown', function (e) {
                        if (e.keyCode === 9 && !e.shiftKey) {
                            e.preventDefault();
                            $modalButton.focus();
                        }
                    });
                    // backward tabbing...
                    $titleText.on('keydown', function (e) {
                        if (e.keyCode === 9 && e.shiftKey) {
                            e.preventDefault();
                            $modalButton.focus();
                        }
                    });
                }
            }, 300);
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/ForceChoiceModalView.js */
/*jslint browser:true, nomen:true */
/*global _, define */

define('forceChoiceModalView', ['flights', 'analytics', 'backbone', 'fluxClickHandler', 'handlebars', 'jquery', 'progress', 'uitk', 'experiments', 'configuration'],
    function (flights, analytics, Backbone, fluxClickHandler, handlebars, $, progress, uitk, experiments, configuration) {

        'use strict';

        var constructFlightDetailsUrl = function (xsellPreference, addHotelPackage, tripId, isSplitTicket, superlatives) {
                return ('/Flight-Search-Details?c=' + $('#originalContinuationId').text() +
                    '&tripId1=' + ' ' +
                    '&offerId=' + encodeURIComponent(tripId) +
                    '&leg1=' + superlatives +
                    '&leg2=' + superlatives +
                    '&xsellchoice=' + xsellPreference +
                    '&addHotelPackage=' + addHotelPackage +
                    '&isSplitTicket=' + (experiments.getVariant(12942) === 1 ? 'false' : isSplitTicket));
            };

        return Backbone.View.extend({
            template: handlebars.templates.xSellHotelForceChoice,
            modalInstance: undefined,
            initialize: function (selectedFlightData, crossSellModel, options) {
                this.selectedFlightData = selectedFlightData;
                this.crossSellModel = crossSellModel;
                this.useAlternateXsellChoice = options && options.useAlternateXsellChoice;
                this.render();
                fluxClickHandler.addHandler('xSellChoiceAddHotelNow', this.addHotelNowHandler, this);
                fluxClickHandler.addHandler('forcedChoiceNoThanks', this.noThanksHandler, this);
                analytics.trackActionWithIncrement('FLT.SR.XSell.PKG.ForcedChoice.ModalDisplayed', $('#xSellHotelForcedChoice'));
                this.handleForcedChoicePopupTabbing(document.activeElement);
                this.listenTo(flights.vent, 'router.noSelectedLegs', this.closeModal);
            },

            render: function () {
                var classes = '',
                    title = ' ';


                this.$el.html(this.template(this.getModalContent()));
                experiments.execute('FORCED.CHOICE.SPLIT.TICKET', {
                    modalContent: this.$el,
                    selectedFlightData: this.selectedFlightData
                });
                $('#forcedChoiceNoThanks').data(this.selectedFlightData);
                $('#xsellAddHotelNow').data(this.selectedFlightData);
                this.modalInstance = uitk.modal.create({
                    content: this.$el,
                    modalId: 'xSellHotelForcedChoice',
                    title: title,
                    classes: classes,
                    closeBtn: false,
                    dismiss: false
                });

                title = $('#forcedChoiceModalTitle').html();
                this.modalInstance.updateContent(this.$el.html(), title);

                flights.vent.trigger('forcedChoiceModal.rendered');
            },

            getModalContent: function () {
                var tripId = this.selectedFlightData.tripId;

                if (tripId) {
                    tripId = tripId.split(':').join('::');
                }

                return {
                    buttonData: this.selectedFlightData,
                    defaultTitle: configuration.xsell.hotel.defaultBannerText,
                    forcedChoiceLegalDisclaimer: configuration.xsell.hotel.forcedChoice.legalDisclaimer,
                    defaultHref: configuration.xsell.hotel.defaultHref,
                    tripId: tripId
                };
            },

            addHotelNowHandler: function (target, event, context) {
                var addHotelButtonData = $(target).data(),
                    isButtonAttributeTrue = function (attribute) {
                        return (attribute === true || (typeof attribute === 'string' && attribute.trim().toLowerCase() === "true"));
                    };

                context.closeModal();

                if (isButtonAttributeTrue(addHotelButtonData.isSplitTicket) && experiments.getVariant(12942) !== 1) {
                    analytics.trackAction('FLT.SR.XSell.PKG.ForcedChoice.AddHotelNow.SplitTicket', $(target));
                    window.open(addHotelButtonData.packageurl, '_blank').opener = null;
                } else if (!isButtonAttributeTrue(addHotelButtonData.isPackageable)) {
                    window.open(addHotelButtonData.packageurl, '_blank').opener = null;
                } else {
                    context.redirectToUDP(addHotelButtonData, context.useAlternateXsellChoice);
                }
            },

            noThanksHandler: function (target, event, context) {
                var noThanksButtonData = $(target).data(),
                    sessionStorage = uitk.createBrowserStorage('session');

                sessionStorage.saveItems({
                    xsellchoicekey: noThanksButtonData.xsellchoice
                });

                context.closeModal();
                context.redirectToUDP(noThanksButtonData, context.useAlternateXsellChoice);
            },

            closeModal: function(){
                if(this.modalInstance !== undefined){
                    this.modalInstance.close();
                }
            },

            handleForcedChoicePopupTabbing: function (previousActiveElement) {
                var $lastControl,
                    $firstControl,
                    $fcContainer = $('.modal-wrap .xsell-aria-hidden');

                if ($fcContainer.length > 0) {
                    $fcContainer.attr('aria-hidden', 'false');
                    $firstControl = $fcContainer.children().first();
                    $('.modal-wrap .modal-title').focus();

                    // put focus back where it started if closing dialog
                    $lastControl = $('.modal-wrap .btn-close');
                    $lastControl.on('click', function () {
                        setTimeout(function () {
                            $(previousActiveElement).focus();
                        }, 600);
                    });
                    // forward tabbing...
                    $lastControl.on('keydown', function (e) {
                        if (e.keyCode === 9 && !e.shiftKey) {
                            e.preventDefault();
                            $firstControl.focus();
                        }
                    });
                    // backward tabbing...
                    $firstControl.on('keydown', function (e) {
                        if (e.keyCode === 9 && e.shiftKey) {
                            e.preventDefault();
                            $lastControl.focus();
                        }
                    });
                }
            },
            redirectToUDP: function (buttonData, useAlternateXsellChoice) {
                var xsellPreference = uitk.createBrowserStorage('session').readItem("xsellchoicekey") || "normal",
                    addHotelPackage = buttonData.addHotelPackage || false,
                    url;

                progress.show('#udpAlertTitle');

                if (navigator.userAgent.indexOf('iPad') > -1 && $.browser.safari !== undefined) {
                    setTimeout(function () {
                        progress.hide();
                    }, 5000);
                }

                if (useAlternateXsellChoice) {
                    xsellPreference = 'showhotelbanneronly';
                }

                url = constructFlightDetailsUrl(xsellPreference, addHotelPackage, buttonData.tripId, buttonData.isSplitTicket, buttonData.superlatives);

                this.windowNavigator.doRedirect(url);
            },
            windowNavigator: {
                doRedirect: function(url) {
                    if(configuration.udp.openInNewTab) {
                        window.open(url,'_blank').opener = null;
                    } else {
                        this.openUrlInSameTab(url);
                    }
                    progress.hide();
                },
                openUrlInSameTab: function(url) {
                    window.location.assign(url);
                }
            }
        });
    });
/* static_content/default/default/scripts/exp/flights/flux/views/XSellBannerView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen:true */
/*global define, require, console */

define('xSellBannerView'
    , ['flights', 'jquery', 'handlebars', 'analytics', 'uitk', 'configuration', 'crossSellOfferView', 'backbone', 'underscore']
    , function(flights, $, handlebars, analytics, uitk, configuration, crossSellOfferView, Backbone, _) {

    'use strict';

    var CLOSED_KEY = 'crossSell.isClosed',
        REPORT_CLICK_TO_PACKAGES_PREFIX = 'FLT.SR.XSell.PKG',
        REPORT_CLOSED = 'FLT.SR.XSell.Close',
        browserSessionStorage = {
            STORAGE_TYPE: 'session',
                uitkBrowserStorage: null,
                createUITKBrowserStorageIfNeeded: function () {
                function createBrowserStorage(storageType) {
                    return 'function' === typeof uitk.createBrowserStorage ? uitk.createBrowserStorage(storageType) : null;
                }
                this.uitkBrowserStorage = this.uitkBrowserStorage || createBrowserStorage(this.STORAGE_TYPE);
            },
            deleteItem: function (key) {
                this.createUITKBrowserStorageIfNeeded();
                if ('function' === typeof this.uitkBrowserStorage.deleteItem) {
                    this.uitkBrowserStorage.deleteItem(key);
                }
            },
            doesKeyExist: function (key) {
                this.createUITKBrowserStorageIfNeeded();
                return 'function' === typeof this.uitkBrowserStorage.doesKeyExist ? this.uitkBrowserStorage.doesKeyExist(key) : false;
            },
            readItem: function (key) {
                this.createUITKBrowserStorageIfNeeded();
                return 'function' === typeof this.uitkBrowserStorage.readItem ? this.uitkBrowserStorage.readItem(key) : null;
            },
            saveItem: function (key, value) {
                this.createUITKBrowserStorageIfNeeded();
                if ('function' === typeof this.uitkBrowserStorage.saveItem) {
                    this.uitkBrowserStorage.saveItem(key, value.toString());
                }
            },
            readItemAsJSON: function (key) {
                this.createUITKBrowserStorageIfNeeded();
                return 'function' === typeof this.uitkBrowserStorage.readJSONAsObject ? this.uitkBrowserStorage.readJSONAsObject(key) : null;
            },
            saveItemAsJSON: function (key, value) {
                this.createUITKBrowserStorageIfNeeded();
                if ('function' === typeof this.uitkBrowserStorage.saveAsJSON) {
                    this.uitkBrowserStorage.saveAsJSON(key, value);
                }
            }
        };

    function disable($target) {
        analytics.trackAction(REPORT_CLOSED, $target);
        browserSessionStorage.saveItem(CLOSED_KEY, 'true');
    }

    function getCrossSellOffer(summary) {
        var superlatives,
            cheapestXsellOffer;

        if ('object' === typeof summary) {
            superlatives = summary.superlatives || [];

            if (superlatives.length > 0) {
                cheapestXsellOffer = _.findWhere(superlatives, {superlativeType: 'CHEAPESTXSELLOFFER'});
            }
        }

        return cheapestXsellOffer;
    }

    return Backbone.View.extend({

        template: handlebars.templates.xSellBannerTemplate,

        crossSellOfferView: undefined,
        cheapestCrossSellOffer: undefined,

        initialize: function(options){
            var self = this;

            self.cheapestCrossSellOffer = getCrossSellOffer(options.searchResultsModel.get('summary'));
            self.href = options.href;
            self.bannerText = options.bannerText;

            if(self.isEnabled()) {
                self.render();
            }

            if (configuration.xsell.hotel.livePricing.enabled) {
                self.listenTo(self.model, 'crossSellModel.updated', function () {
                    var router;

                    require(['setupRouter'], function (setupRouter) {
                        router = setupRouter();
                    });

                    if(undefined === router || router.getNextLegToView() === 0) {
                        self.updateBanner();
                        self.bindUserInteractionEvents();
                    }
                });
            }

            self.listenTo(flights.vent, 'router.noSelectedLegs', self.updateBanner);

            self.listenTo(flights.vent, 'router.selectedLegs', function () {
                $('#xsell-banner-default, #xsell-disclaimer').hide();
                if(self.crossSellOfferView) {
                    self.crossSellOfferView.empty();
                }
            });
        },

        render: function() {
            var markup = this.template({
                xsellHref: this.href,
                xsellMessage: this.bannerText
            });

            $(markup).insertAfter('#sortBar');

            if (!configuration.xsell.hotel.livePricing.enabled) {
                $('#xsell-disclaimer').show();
            }

            return this;
        },

        showLivePriceBanner: function() {

            var packageSaving;

            $('#xsell-banner-default .xsell-link').attr("href", this.model.get('crossSellUrl'));
            packageSaving = this.model.get('saving');

            $('#xsell-banner-default .xsell-description-livepricing').find(' .saving').text(packageSaving);
            $('#xsell-banner-default .xsell-description-livepricing').removeClass("hidden").fadeIn();
            $('#xsell-banner-default').removeClass("hidden").fadeIn();

            // we don't show the disclaimer for live price
            if(!configuration.xsell.car.enabled){
                $('#xsell-disclaimer').hide();
            }
        },

        showGenericBanner: function() {

            $('#xsell-banner-default .xsell-description').removeClass("hidden").fadeIn();
            $("#xsell-banner-default").removeClass("hidden").fadeIn();

            $('#xsell-disclaimer').show();

            if (configuration.xsell.hotel.livePricing.threshold && this.model.get('savingValue') < configuration.xsell.hotel.livePricing.threshold) {
                analytics.trackImpression('FLT.SR.GenericBannerDisplayed.Threshold');
            } else {
                analytics.trackImpression('FLT.SR.GenericBannerDisplayed');
            }
        },

        bindUserInteractionEvents: function(){
            var self = this,
                $xsellBanner = $('#xsell-banner-default');

            $xsellBanner.on(uitk.clickEvent, 'button.btn-close', function() {
                disable(this);
                $xsellBanner.hide();
                if(!configuration.xsell.car.enabled){
                    $xsellBanner.hide();
                }
            });

            $xsellBanner.on(uitk.clickEvent, '.xsell-link', function() {

                if (configuration.xsell.hotel.livePricing.enabled && self.model.doesLivePricingExist()) {
                    self.model.logOmnitureClickTrackData('FLT.SR.XSell.PKG.Live.Pricing', this);
                } else {
                    analytics.trackAction(REPORT_CLICK_TO_PACKAGES_PREFIX, this);
                }
            });
        },

        updateBanner: function() {

            if(!this.isEnabled()) {
                return;
            }

            if (this.model.doesLivePricingExist()) {

                if (configuration.xsell.hotel.livePricing.brandedDealEnabled && this.cheapestCrossSellOffer !== undefined) {
                    this.setupCrossSellOfferView();
                }

                if (configuration.xsell.hotel.livePricing.brandedDealEnabled && this.crossSellOfferView !== undefined) {
                    this.crossSellOfferView.render();
                } else {
                    this.showLivePriceBanner();
                }
            } else {
                this.showGenericBanner();
            }
        },

        setupCrossSellOfferView: function(){
            var self = this,
                cheapestCrossSellOffer = self.cheapestCrossSellOffer,
                isSingleLeg = configuration.view.isByot;

            if(cheapestCrossSellOffer === undefined) {
                return;
            }

            cheapestCrossSellOffer.offer.legs = [];

            $.each(cheapestCrossSellOffer.offer.legIds, function (i, legNaturalKey) {
                cheapestCrossSellOffer.offer.legs[i] = cheapestCrossSellOffer.legs[legNaturalKey];
            });

            if(isSingleLeg === true) {
                cheapestCrossSellOffer.offer.legs = [cheapestCrossSellOffer.offer.legs[0]];
            }

            self.crossSellOfferView = new crossSellOfferView({
                crossSellOffer: cheapestCrossSellOffer.offer,
                crossSellModel: self.model
            });
        },

        isEnabled: function() {
            return !browserSessionStorage.doesKeyExist(CLOSED_KEY);
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/StandardOfferDetailsView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen:true */
/*global define, require, console */

define('standardOfferDetailsView', ['flights', 'uitk', 'jquery', 'handlebars', 'standardBaggageFeeView','analytics', 'configuration', 'i18n', 'backbone','loyaltyPointsCollection', 'flightDetailsLoyaltyEarnView', 'sitebrand'],
    function(flights, uitk, $, handlebars, StandardBaggageFeeView, Analytics, configuration, i18n, Backbone, loyaltyPointsCollection, FlightDetailsLoyaltyEarnView, sitebrand) {

        'use strict';

        function renderDetailsMarkup() {

            var offerModel = this.model,
                attributes = offerModel.attributes,
                naturalKey = offerModel.get('naturalKey'),
                $targetModule = $('div[data-offer-natural-key="' + naturalKey + '"]').siblings('.details-holder'),
                legs,
                classes = 'flight-details-tabs',
                showBestPriceGuarantee = true,
                showFreeCancellation = configuration.showFreeCancellationInDetails,
                markup,
                avion,
                partnerLoyalty = (typeof attributes.partnerLoyaltyData === "object" && attributes.partnerLoyaltyData.length > 0),
                partnerLoyaltyData = (partnerLoyalty) ? attributes.partnerLoyaltyData : [],
                $markup,
                templateModel,
                getLoyaltyTooltipContentLocStringId = function (options) {
                    if(options.paybackEnabled === false) {
                        return;
                    }

                    if(options.isFlexibleShopping === false) {
                        return 'pb_flight_search_results_message';
                    }

                    if(options.ab10895status === true) {
                        return 'Payback2XPointsPromoContent';
                    }

                    return 'pb_flight_search_results_message_MIS';
                },
                getTotalPriceMessageLocStringId = function (totalPassengers) {
                    var locStringId = '';

                    if (totalPassengers === 1) {
                        locStringId += 'singleTraveler';
                    }
                    else {
                        locStringId += 'multiTraveler';
                    }

                    if (configuration.route.isOneWay) {
                        locStringId += 'OneWayPricing';
                    }
                    else if(configuration.route.isMultiDest) {
                        locStringId += 'MultiDestPricing';
                    }
                    else {
                        locStringId += 'RoundtripPricing';
                    }

                    if (configuration.removeFeesFromTitleLegalese) {
                        locStringId += 'NoFeesText';
                    }

                    return locStringId;
                };
            this.standardBaggageFeeView = new StandardBaggageFeeView({model: {offer: offerModel}, el: this.el});
            legs = this.standardBaggageFeeView.model.legs;

            if (legs.length === 1) {
                classes = classes.concat(' hide-tabs');
            }

            $.each(legs, function(index, leg) {
                leg.tabId = 'offer-leg' + index + '-details';
                leg.legAttributes = 'leg-index:' + index + '|click-handler:omnitureClickHandler|omniture-rfrr:FLT.SR.Details.Leg' + index + '|test-id:leg-details-tab';
                leg.selected = (0 === index).toString();

                if(!leg.price.feesMessage.isShowBestPriceGuarantee) {
                    showBestPriceGuarantee = false;
                }
                if(!leg.price.feesMessage.isShowFreeCancellation) {
                    showFreeCancellation = false;
                }
            });

            templateModel = {
                offer: attributes,
                legs: legs,
                classes: classes,
                selectedCabinClass: flights.Wizard.searchParameters.flightClass,
                totalPassengers: flights.Wizard.searchParameters.totalTravelers,
                testAndLearn: {
                    brandedDeals: {
                        isNotCrossSellOffer: !(configuration.xsell.hotel.livePricing.brandedDealEnabled && naturalKey.indexOf('crossselloffer') > -1)
                    }
                },
                showBestPriceGuarantee: showBestPriceGuarantee,
                showFreeCancellation: showFreeCancellation,
                obFeeThinListing: configuration.obFeeThinListing,
                showBestPriceGuaranteeAndFreeCancellation: !configuration.route.isMultiDest,
                loyalty: {
                    enabled: configuration.loyalty.enabled,
                    showPoints: !configuration.loyalty.isTaapAgentOnNectarSite && ( configuration.loyalty.enabled || (!configuration.route.isMultiDest && configuration.loyalty.nectarEnabled)),
                    showMessaging: configuration.loyalty.showMessaging,
                    programName: configuration.loyalty.programName,
                    logoUrl: configuration.loyalty.detailsLogoUrl,
                    nectar: {
                        promo2XEnabled: configuration.loyalty.nectar2XPromoEnabled,
                        enabled: configuration.loyalty.nectarEnabled,
                        sterlingEnabled: configuration.loyalty.nectarSterlingEnabled,
                        points: configuration.loyalty.nectarPoints,
                        creditWindowDays: configuration.loyalty.nectarCreditWindowDays
                    },
                    payback: {
                        enabled: configuration.loyalty.paybackEnabled,
                        points: configuration.loyalty.paybackPoints,
                        staticEarnMessageEnabled: configuration.loyalty.staticEarnMessageEnabled,
                        ab10895status: configuration.loyalty.ab10895status
                    },
                    tooltipContentLocStringId: getLoyaltyTooltipContentLocStringId({
                        paybackEnabled: configuration.loyalty.paybackEnabled,
                        ab10895status: configuration.loyalty.ab10895status,
                        isFlexibleShopping: !configuration.path.isFlightOnly
                    })
                },
                isFlexibleShopping: !configuration.path.isFlightOnly,
                freeCancellationTooltip: configuration.freeCancellationTooltip,
                totalPriceMessageLocStringId: getTotalPriceMessageLocStringId(flights.Wizard.searchParameters.totalTravelers),
                freeCancellationLink: configuration.freeCancellationLink,
                showObFeeMessageFFOP: configuration.showObFeeMessageFFOP
            };
            // Partner Loyalty Data
            if (partnerLoyalty === true) {
                if (uitk.avion !== undefined) {
                    avion = uitk.avion;
                }
                templateModel.partnerLoyalty = partnerLoyalty;
                if (avion === undefined) {
                    templateModel.avionPricing = false;
                } else {
                    templateModel.avion = avion;
                    templateModel.avionPricing = true;
                    templateModel.partnerLoyaltyDataNonAvion = partnerLoyaltyData[1];
                    templateModel.totalPriceMessageLocStringIdAvion = "PartnerLoyalty_Avion" + templateModel.totalPriceMessageLocStringId;
                }
                templateModel.partnerLoyaltyData = partnerLoyaltyData[0];
                templateModel.totalPriceMessageLocStringId = "PartnerLoyalty_" + templateModel.totalPriceMessageLocStringId;
            }

            markup = this.template(templateModel);

            $markup = $(markup);
            $markup.insertAfter($targetModule);
            this.createLoyalty($markup, offerModel);

            uitk.publish("FSR.Details.Opened", attributes.index);
        }

        function getSeatMapFlightListForLeg(leg){

            var seatmapFlightList = [];

            $.each(leg.timeline, function(index, flight){
                var date;
                if(flight.layover){ return 'continue'; }

                date = uitk.utils.createLocalizedDate(flight.departureTime.date, sitebrand.locale).date;

                seatmapFlightList.push({
                    fromAirportCode: flight.departureAirport.code,
                    toAirportCode: flight.arrivalAirport.code,
                    duration: {
                        hours: flight.duration.hours,
                        minutes: flight.duration.minutes
                    },
                    flightNumber: flight.carrier.flightNumber,
                    airCode: flight.carrier.planeCode,
                    airline: flight.carrier.airlineName,
                    airlineCode: flight.carrier.airlineCode,
                    equipmentType: flight.carrier.plane,
                    bookingCode: flight.carrier.bookingCode,
                    date: (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate())
                });
            });

            return seatmapFlightList;
        }

        return Backbone.View.extend({
            template: handlebars.templates.moduleDetailsTemplate,

            events : {
                'click .flight-details-link' : 'toggleFlightDetails',
                'click .tab [data-leg-index]' : 'showLegMarkupByIndex',
                'click .seat-map-link' : 'showSeatMap',
                'keypress .flight-details-link': 'toggleFlightDetailsWithKeyPress'

            },

            toggleFlightDetailsWithKeyPress: function(event) {
                if(event.keyCode === 32) {
                    event.preventDefault();
                    this.toggleFlightDetails(event);
                }
            },

            showLegMarkupByIndex: function(event) {
                var $target = $(event.currentTarget),
                    index = $target.data('leg-index'),
                    detailsDisplayedMessage;

                this.$el.find('.details-confidence-messaging[data-leg-index="' + index + '"]').show();
                this.$el.find('.details-confidence-messaging:not([data-leg-index="' + index + '"])').hide();

                if(index === 0) {
                    detailsDisplayedMessage = i18n.standardofferdetails.accessibility.departureDetailsDisplayed;
                }

                if(index === 1) {
                    detailsDisplayedMessage = i18n.standardofferdetails.accessibility.returnDetailsDisplayed;
                }

                if(configuration.route.isMultiDest) {
                    detailsDisplayedMessage = i18n.standardofferdetails.accessibility.tripIndexDetailsDisplayed.replace('{{tripIndex}}', index + 1);
                }

                uitk.utils.liveAnnounce(detailsDisplayedMessage, 'polite');

            },

            toggleFlightDetails: function(event){
                event.preventDefault();
                var $detailsLink = $(this.el).find('.flight-details-link')
                    , openClass = 'open'
                    , isDetailsOpen = $detailsLink.hasClass(openClass);

                if( isDetailsOpen ){
                    this._hideFlightDetails();
                    $detailsLink.removeClass(openClass).attr('aria-expanded', 'false');
                    uitk.utils.liveAnnounce(i18n.standardofferdetails.accessibility.detailsCollapsed, 'polite');
                } else {
                    this._showFlightDetails();
                    $detailsLink.addClass(openClass).attr('aria-expanded', 'true');
                    uitk.utils.liveAnnounce(i18n.standardofferdetails.accessibility.detailsExpanded, 'polite');
                }
            },

            _showFlightDetails: function() {
                var naturalKey = this.model.get('naturalKey'),
                    trackId = 'FLT.SR.DetailsExpand';

                if (configuration.xsell.hotel.livePricing.brandedDealEnabled && naturalKey.indexOf('crossselloffer') > -1) {
                    trackId = 'FLT.SR.DifferentiatedListing.DetailsExpand';
                }

                renderDetailsMarkup.call(this);

                this.$el.addClass('open');
                this.$el.find('.details-confidence-messaging:not([data-leg-index="0"])').hide();
                this.$el.find('.hide-flight-details').closest('.flight-details-link').focus();

                Analytics.trackActionWithIncrement(trackId, this.$el.find('.show-flight-details')[0]);

            },

            _hideFlightDetails: function() {
                var naturalKey = this.model.get('naturalKey'),
                    trackId = 'FLT.SR.DetailsHide';

                if (configuration.xsell.hotel.livePricing.brandedDealEnabled && naturalKey.indexOf('crossselloffer') > -1) {
                    trackId = 'FLT.SR.DifferentiatedListing.DetailsHide';
                }
                this.$el.removeClass('open');
                this.$el.find('.flight-details').remove();
                Analytics.trackActionWithIncrement(trackId, this.$el.find('.hide-flight-details')[0]);
            },

            showSeatMap: function(event) {
                var legIndex = parseInt($(event.currentTarget).data('legIndex'),10),
                    legs = this.standardBaggageFeeView.model.legs;

                window.seatmap.show({
                    flights: getSeatMapFlightListForLeg(legs[legIndex]),
                    configuration: {
                        omniturePrefix: 'FLT.SR'
                    }
                });

                /* exp10410: SEATMAP_SELECT_SEAT_LATER.MODAL */
                uitk.publish("FSR.Seatmap.Opened");
            },
            createLoyalty: function($el, offerModel) {
                var isBrandedDealOffer = offerModel.get('naturalKey').indexOf('crossselloffer') > -1;

                if(loyaltyPointsCollection.isLoyaltyOfferEnabled && !isBrandedDealOffer) {
                    this.loyaltyView = new FlightDetailsLoyaltyEarnView({model: loyaltyPointsCollection,
                        el: $el,
                        offer:offerModel,
                        loyaltyInfo: configuration.loyalty
                    });
                }
            }
        });
    });
/* static_content/default/default/scripts/exp/flights/flux/views/StandardBaggageFeeView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('standardBaggageFeeView', ['flights', 'jquery', 'handlebars', 'configuration', 'backbone', 'baggageFeeView', 'i18n', 'cacheModel'], function(flights, $, handlebars, configuration, Backbone, BaggageFeeView, i18n, CacheModel) {

    'use strict';

    function registerBaggageDetailHelperFlux() {
        handlebars.registerHelper('displayDetailInfoFlux', function (baggageFees, feeType) {
            var response = '';
            var loc = i18n.bagWeightDetails;
            if (feeType == "NO_FEE") {
                if (baggageFees != null && baggageFees.weightDesc == 'upto') {
                    if (baggageFees.unitOfWeight == 'kg') {
                        response = loc.noFeeTagKg;
                    }
                    else if (baggageFees.unitOfWeight == 'lbs') {
                        response = loc.noFeeTagLbs;
                    }
                    response = response.replace("{weight}", baggageFees.weight);
                }
                else {
                    response = loc.noFeeTag;
                }
            }
            else { // Process for amount. This will not execute for "NO_INFO" case.
                if (baggageFees != null && baggageFees.weightDesc == 'upto') {
                    if (baggageFees.unitOfWeight == 'kg') {
                        response = loc.feeTagKg;
                    }
                    else if (baggageFees.unitOfWeight == 'lbs') {
                        response = loc.feeTagLbs;
                    }
                    response = response.replace("{weight}", baggageFees.weight);
                }
                else if (baggageFees != null && baggageFees.weightDesc == 'per') {
                    if (baggageFees.unitOfWeight == 'kg') {
                        response = loc.bagPerKg;
                    }
                    else if (baggageFees.unitOfWeight == 'lbs') {
                        response = loc.bagPerLbs;
                    }
                }
                else {
                    response = loc.feeTag;
                }
                response = response.replace("{fee}", feeType);
            }
            return new handlebars.SafeString(response);
        });
    }

    return BaggageFeeView.extend({
        template: handlebars.templates.detailsBaggageFeeInfoTemplate,
        inlineAjaxUrl : '/api/flight/bagfeesmcfilterbyac',
        externalPageUrl : '/Flights-BagFeesFilterByAC?',
        initialize: function () {
            this.cachedBaggageFeeInfo = new CacheModel();
            BaggageFeeView.prototype.initialize.apply(this, arguments);
            this.render();
            registerBaggageDetailHelperFlux();
        },

        events : {
            'click a.baggageFeeLink' : 'baggageFeeLinkHelper'
        },

        _renderBaggageFeeMarkup: function (cachedEntry) {
            var legIndex = cachedEntry.legIndex,
                responseText = cachedEntry.responseText,
                showBaggageFeeOnPurchaseMsg = cachedEntry.showBaggageFeeOnPurchaseMsg,
                showBaggageFeeIncludedMsg = cachedEntry.showBaggageFeeIncludedMsg;
            $(this.el).find('.details-baggage-fee-info .loader-container').remove();
            $($(this.el).find('.details-baggage-fee-info')[legIndex]).append(this.template({
                baggageFees: $.parseJSON(responseText),
                legIndex: legIndex,
                showBaggageFeeOnPurchaseMsg: showBaggageFeeOnPurchaseMsg,
                showBaggageFeeIncludedMsg: showBaggageFeeIncludedMsg
            }));
        },

        _isResponseCached: function(naturalKey) {
            return this.cachedBaggageFeeInfo.containsEntry(naturalKey);
        },

        _cacheCurrentResponse: function(naturalKey, legIndex, responseText) {
            this.cachedBaggageFeeInfo.putEntry(naturalKey,{legIndex : legIndex, responseText : responseText});
        },

        _retrieveCachedResponse: function(naturalKey) {
            return this.cachedBaggageFeeInfo.getCachedEntry(naturalKey);
        },

        _getFlightSegments: function(leg) {
            var timeline, segment, segments = [], timelineLength = leg.timeline.length;
            for (var i = 0; i < timelineLength; i++) {
                timeline = leg.timeline[i];
                if (typeof timeline.segment !== 'undefined' && timeline.segment === true) {
                    segment = {
                        'originapt': timeline.departureAirport.code,
                        'destinationapt': timeline.arrivalAirport.code,
                        'cabinclass': timeline.carrier.cabinClass,
                        'mktgcarrier': timeline.carrier.airlineCode,
                        'opcarrier': timeline.carrier.operatedByAirlineCode,
                        'bookingclass': timeline.carrier.bookingCode,
                        'farebasis': leg.fareBasisCode || "",
                        'traveldate': timeline.departureTime.travelDate,
                        'flightnumber': timeline.carrier.flightNumber,
                        'segmentnumber': segments.length + 1
                    };
                    segments.push(segment);
                }
            }
            return segments;
        },

        render: function () {
            var self = this,
                fareBasisDetail,
                cachedResponse;
            $.each(self.model.legs, function(index, leg){
                if (!self._isResponseCached(leg.naturalKey)) {
                    fareBasisDetail = self.model.fareBasisDetails[leg.naturalKey],
                    $.ajax({
                        type: 'POST',
                        contentType:'application/json',
                        url: '/api/flight/bagfeesmcfilterbyacv2',
                        data: JSON.stringify(self._getFlightSegments(leg)),
                        dataType: 'json',
                        timeout: 3000
                    }).success(function (responseData) {
                    	self._cacheCurrentResponse(leg.naturalKey, index, JSON.stringify(responseData));
                    }).complete(function (responseData) {
                        var showBaggageFeeOnPurchaseMsg = leg.price.feesMessage.showBaggageFeeOnPurchaseMsg,
                            showBaggageFeeIncludedMsg = leg.price.feesMessage.showBaggageFeeIncludedMsg;
                        self._renderBaggageFeeMarkup({legIndex : index, responseText : responseData.responseText, showBaggageFeeOnPurchaseMsg: showBaggageFeeOnPurchaseMsg, showBaggageFeeIncludedMsg: showBaggageFeeIncludedMsg });
                    });

                } else {
                	setTimeout(function() {
                        cachedResponse = self._retrieveCachedResponse(leg.naturalKey);
                        cachedResponse.showBaggageFeeOnPurchaseMsg = leg.price.feesMessage.showBaggageFeeOnPurchaseMsg;
                        cachedResponse.showBaggageFeeIncludedMsg = leg.price.feesMessage.showBaggageFeeIncludedMsg;
                		self._renderBaggageFeeMarkup(cachedResponse);
                	},0);
                }
            });
            return this;
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/views/RouteHappyView.js */
/*jslint browser: true, white: true */
/*jshint loopfunc: true */
/*global define, require */

define('routeHappyView', ['flights', 'jquery', 'handlebars', 'backbone', 'underscore', 'experiments'], function(flights, $, handlebars, Backbone, _, experiments) {

    'use strict';

    return Backbone.View.extend({
        template:  handlebars.templates.rhSuperlativeTemplate,

        initialize: function (opts) {
            this.renderOnEachUpdate = typeof opts === 'object' && opts.renderOnEachUpdate === true;
            this.useLegLevelInfo = typeof opts === 'object' && opts.useLegLevelInfo === true;
            this.getOfferElement = opts && typeof opts.getOfferElement === 'function'? opts.getOfferElement : undefined;
        },

        renderRouteHappyInfo: function (options, collection) {
            var self = this;

            if (!self.renderOnEachUpdate && options && options.source === 'client') {
                return;
            }

            collection.each(function (model) {
                var offerId = model.id;
                var $offer = self.getOfferElement(offerId);
                var $rhSuperlative = self.getRouteHappyElement(offerId);
                var rhInfo = model.toJSON();
                var rating = rhInfo.rating;
                var legId;
                var $leg;
                var rhLegInfo;
                var description;
                var linkContent;

                if(0 === $offer.length || 0 === $rhSuperlative.length) {
                    return;
                }

                if(true === self.useLegLevelInfo) {
                    $leg = $offer.find('[data-leg-natural-key]');

                    if(0 === $leg.length) {
                        return;
                    }

                    legId = $leg.data().legNaturalKey;
                    rhLegInfo = rhInfo.legs.get(legId);

                    if(undefined === rhLegInfo) {
                        return;
                    }

                    rating = rhLegInfo.get('rating');
                }

                description = self.getDescription(rating.score);

                linkContent = handlebars.templates.rhSuperlativeLinkContent({
                    scoreDescription: description,
                    flightScoreValue: rating.score
                });

                $rhSuperlative.html(
                    self.template({
                        linkContent: linkContent,
                        extraClasses: self.getExtraClasses(rating.score)
                    })
                );
            });

        },

        getExtraClasses: function (score) {
            var extraClasses = '';

            score = score.replace(',', '.');
            score = parseFloat(score);

            if (score >= 0 && score <= 4.9) {
                extraClasses = 'poor';
            } else if (score >= 5 && score <= 5.9) {
                extraClasses = 'fair';
            } else if (score >= 6 && score <= 6.9) {
                extraClasses = 'satisfactory';
            } else if (score >= 7 && score <= 7.4) {
                extraClasses = 'good';
            } else if (score >= 7.5 && score <= 8.4) {
                extraClasses = 'very-good';
            } else if (score >= 8.5 && score <= 10) {
                extraClasses = 'excellent';
            }

            return extraClasses;
        },

        getRouteHappyElement: function (offerId) {
            if (!this.getOfferElement) {
                flights.log('getOfferElement has not been defined');
                return;
            }
            return this.getOfferElement(offerId).find('.route-happy-superlative');
        },

        getDescription: function (score) {
            var isSingleLeg = this.useLegLevelInfo === true,
                descriptionLoc = 'views_default_controls_flight_searchresults_flux_offerstrings.',
                description;

            score = score.replace(',', '.');
            score = parseFloat(score);

            if (score >= 0 && score <= 4.9) {
                description = descriptionLoc + (isSingleLeg ? 'poorFlight' : 'poorFlights');
            } else if (score >= 5 && score <= 5.9) {
                description = descriptionLoc + (isSingleLeg ? 'fairFlight' : 'fairFlights');
            } else if (score >= 6 && score <= 6.9) {
                description = descriptionLoc + (isSingleLeg ? 'satisfactoryFlight' : 'satisfactoryFlights');
            } else if (score >= 7 && score <= 7.4) {
                description = descriptionLoc + (isSingleLeg ? 'goodFlight' : 'goodFlights');
            } else if (score >= 7.5 && score <= 8.4) {
                description = descriptionLoc + (isSingleLeg ? 'veryGoodFlight' : 'veryGoodFlights');
            } else if (score >= 8.5 && score <= 10) {
                description = descriptionLoc + (isSingleLeg ? 'excellentFlight' : 'excellentFlights');
            }

            return description;
        }

    });
});

/* static_content/default/default/scripts/exp/flights/searchResults/OperatedByStringBuilder.js */
/* jshint nomen: true */
/*global define, require, _ */

define('operatedByStringBuilder', ['i18n'], function (i18n) {
    'use strict';
    var getCollapsedStrings = function (segments) {
            var validSegments,
                operatedByLines = [],
                generateValidSegmentMap = function (segments) {
                    var segmentMap = [],
                        carrierGroups = _.chain(segments)
                            .filter(function (segment) { return segment.layover === false && segment.segment === true; })
                            .filter(function (segment) { return segment.carrier.operatedBy !== ''; })
                            .map(function (segment) { return segment.carrier; })
                            .groupBy(function (carrier) { return carrier.airlineName; })
                            .value();
                    _.each(carrierGroups, function (carrier) {
                        segmentMap.push(_(carrier).groupBy('operatedBy'));
                    });
                    return segmentMap;
                },
                collectFlightNumbers = function (operatorGroup) {
                    return _.map(operatorGroup, function (segment) {
                        return segment.flightNumber;
                    });
                },
                constructOperatedByList = function (airlineName, operator, flightNumbers, operatedByString) {
                    if (flightNumbers.length === 1) {
                        operatedByString = i18n.operatedBy.operatedByListEnd
                            .replace('{{operatedByList}}', operatedByString)
                            .replace('{{finalFlightNumber}}', _(flightNumbers).first());
                        return operatedByString;
                    }
                    if (flightNumbers.length > 1) {
                        operatedByString = i18n.operatedBy.operatedByList
                            .replace('{{operatedByList}}', operatedByString)
                            .replace('{{flightNumberToAppend}}', _(flightNumbers).first());
                        return constructOperatedByList(airlineName, operator, _(flightNumbers).rest(), operatedByString);
                    }
                    return operatedByString;
                },
                constructOperatedByString = function (airlineName, operator, flightNumbers) {
                    var operatedByString = i18n.operatedBy.operatedByListInitial
                        .replace('{{airlineName}}', airlineName)
                        .replace('{{flightNumber}}', _(flightNumbers).first());
                    operatedByString = constructOperatedByList(airlineName, operator, _(flightNumbers).rest(), operatedByString);
                    return i18n.operatedBy.operatedBy
                        .replace('{{operatedByListEnd}}', operatedByString)
                        .replace('{{operatingAirline}}', operator);
                };

            validSegments = generateValidSegmentMap(segments);
            _.each(validSegments, function (segment) {
                _.each(segment, function (segmentGroup) {
                    operatedByLines.push(constructOperatedByString(
                        segmentGroup[0].airlineName,
                        segmentGroup[0].operatedBy,
                        collectFlightNumbers(segmentGroup)
                    ));
                });
            });
            return operatedByLines.join('<br/>');
        };
    return getCollapsedStrings;
});

require(['operatedByStringBuilder']);
/* static_content/default/default/scripts/exp/flights/flux/views/MixedCabinClassMessageView.js */
define('mixedCabinClassMessageView', ['flights', 'jquery', 'handlebars', 'backbone', 'underscore'], function(flights, $, handlebars, Backbone, _) {
    'use strict';

    var wizardData;

    function shouldDisplayMessage(legs) {
        var hasWorseFareSegment = false;

        if(isEconomyCabinClass(wizardData.selectedCabin)) {
            return false;
        }

        $.each(legs, function(legIndex, leg) {
            $.each(leg.timeline, function(timelineIndex, timelineEntry) {
                hasWorseFareSegment = timelineEntry.segment && segmentIsWorseFare(timelineEntry);
                if(hasWorseFareSegment) {
                    return false; //break
                }
            });

            if(hasWorseFareSegment) {
                return false; //break
            }
        });

        return hasWorseFareSegment;
    }

    function segmentIsWorseFare(timelineEntry) {
        var segmentCabinClass = parseInt(timelineEntry.carrier.cabinClass, 10),
            isSegmentEconomy = isEconomyCabinClass(segmentCabinClass),
            isEconomyPlusSelected = wizardData.selectedCabin === 5,
            isSegmentWorseFareThanSelected = wizardData.selectedCabin < segmentCabinClass;

        return  (isEconomyPlusSelected && isSegmentEconomy) ||
                (!isEconomyPlusSelected && isSegmentWorseFareThanSelected);
    }

    function getCabinClassText() {
        var cabinClass = _.findWhere(wizardData.cabinClassList, {code: wizardData.selectedCabin.toString()});

        if (cabinClass) {
            return cabinClass.name;
        }

        return '';
    }

    function isEconomyCabinClass(cabinClass) {
        return cabinClass === 3;
    }

    return Backbone.View.extend({
        template: handlebars.templates.mixedCabinClassMessageTemplate,
        initialize: function(options) {
            var self = this;
            wizardData = options;

            self.setElement('#mixed-cabin-class-message');

            self.listenTo(flights.vent, 'uiModel.resultsFetchSuccess', function() {
                self.render();
            });
        },
        render: function() {
            var legs;

            try{
                legs = flights.collections.legsCollection.models[0].attributes;
            } catch(err) {
                flights.log('MixedCabinClassMessageView: ' + err);
                return;
            }

            if(shouldDisplayMessage(legs)) {
                this.displayMessage();
            }
        },
        displayMessage: function() {
            this.$el.html(this.template({selectedCabinClassText: getCabinClassText()}));

            this.$el.removeClass('hide');
            $('#info-about-results').removeClass('hide');
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/AirAttachModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, Backbone, console, _ */

define('airAttachModel', ['flights', 'jquery', 'dctk/dctk', 'configuration', 'backbone', 'underscore'], function(flights, $, dctk, configuration, Backbone, _) {
    'use strict';

    var LOG_RESPONSE_FAIL = 'AJAX-Fail';

    return Backbone.Model.extend({

        url: '/Recommender-Ajax',
        timeout: configuration.xsell.hotel.livePricing.timeout,
        defaults : {
            packageModels : [],
            totalResultsCount: 0,
            errorCode: 0
        },
        request : {},
        ajaxCallStartTime : 0,
        crossSellModel: {},

        initialize: function(options) {
            this.crossSellModel = options.crossSellModel;
            this.initializeRequest(options.singlePageModel);
        },
        convertDateStringFromISOtoUSFormat: function(iso) {
            var d = iso.split('-');
            return d[1] + '-' + d[2] + '-' + d[0];
        },
        initializeRequest: function(singlePageModel) {

            var childrenString = '';

            if (flights.Model.Wizard.childCount > 0) {
                childrenString = ("1_" + flights.Model.Wizard.childAges.toString()).replace(/\,/g, ",1_");
            }

            this.request = {
                'scenario': 'fsr',
                'sdate': this.convertDateStringFromISOtoUSFormat(singlePageModel.get('departureISODate')),
                'edate': this.convertDateStringFromISOtoUSFormat(singlePageModel.get('arrivalISODate')),
                'dest': encodeURIComponent(singlePageModel.get('arrivalAirportCode')),
                'otla': singlePageModel.get('departureAirportCode'),
                'dtla': singlePageModel.get('arrivalAirportCode'),
                'adults': flights.Model.Wizard.adultCount,
                'seniors': '0',
                'children': childrenString,
                'infantInLap': flights.Model.Wizard.infantsInLap,
                'rule': 'flight-hotel-xsell',
                'bdls': false
            };
        },
        getResults: function(searchResultsModel, numOffersToRequest, shouldGetBrandedDeals, sort) {

            var self = this,
                data = self.request,
                logData = ['object=livePricingAjaxHandler', 'function=request'],
                cheapestXSellOffer = self.helpers.getCheapestXSellOffer(searchResultsModel),
                callDuration = 0;

            numOffersToRequest = numOffersToRequest || '5';
            shouldGetBrandedDeals = shouldGetBrandedDeals || false;
            sort = sort || '-1';

            if (null === cheapestXSellOffer) {
                self.updateResponse(null, false);
                return;
            }

            data = $.extend(true, {
                'pkid': cheapestXSellOffer.piid,
                'count': numOffersToRequest,
                'bdls': shouldGetBrandedDeals,
                'sort': sort
            }, data);

            logData = logData.concat(flights.utils.objToStringArray(data, 'options-'));

            this.fetch({
                data: data,
                timeout: self.timeout,
                success: function (model, response, options) {

                    var packageModels = model.get('packageModels') || [];

                    if (packageModels.length > 0) {

                        self.updateResponse(packageModels);

                        // log impression track data - this should happen on every successful live pricing call
                        self.crossSellModel.logOmnitureImpressionTrackData('Air Attach Pricing');
                    } else {

                        self.updateResponse(packageModels);

                        logData = logData.concat(flights.utils.objToStringArray(response, 'response-'));

                        if (response.errorCode !== 0) {
                            dctk.loggingAdapter.logMessage('RECOMMENDER-SERVICE-RETURN-ERROR', logData);
                        } else {
                            dctk.loggingAdapter.logMessage('RECOMMENDER-SERVICE-RETURN-ZERO-RESULT', logData);
                        }
                    }

                    // logging the call duration in always(), seemed to add some milliseconds of padding so to catch exact time
                    // logging it in success() and fail() methods rather than in always
                    callDuration = ((new Date()).getTime() - self.ajaxCallStartTime);
                    dctk.loggingAdapter.logTrxEvent("getLivePricing", ["clEventName01=getLivePricing-Success",
                            "clEventTime01=" + callDuration]);
                    self.ajaxCallStartTime = 0;
                },
                error: function (model, response, options) {

                    self.updateResponse();

                    logData.push('attemptsCount=' + options.attemptsCount);
                    logData.push('maxAttempts=' + options.maxAttempts);
                    logData.push('callback=fail');
                    logData.push('statusParameter=' + response.status);
                    logData.push('errorParameter=' + response.statusText);

                    dctk.loggingAdapter.logMessage(LOG_RESPONSE_FAIL, logData);

                    callDuration = ((new Date()).getTime() - self.ajaxCallStartTime);
                    dctk.loggingAdapter.logTrxEvent("getLivePricing", ["clEventName01=getLivePricing-Failure",
                            "clEventTime01=" + ((new Date()).getTime() - self.ajaxCallStartTime)]);
                    self.ajaxCallStartTime = 0;
                },
                beforeSend: function(model, response, options) {
                    // save the call start time for performance timer
                    self.ajaxCallStartTime = (new Date()).getTime();
                }
            });
        },
        helpers: {
            getCheapestXSellOffer: function (searchResultsModel) {

                searchResultsModel = searchResultsModel.toJSON();

                var superlatives = searchResultsModel.summary.superlatives || [],
                    cheapestXsellOffer = null;

                if (superlatives.length > 0) {

                    cheapestXsellOffer = _.findWhere(superlatives, {superlativeType: 'CHEAPESTXSELLOFFER'});

                    if (undefined !== cheapestXsellOffer) {
                        return cheapestXsellOffer;
                    }
                }

                return null;
            }
        },
        updateResponse: function(packageModels) {

            var changeHotelUrl,
                data,
                omnitureData,
                saving,
                xSellDescription = '<b id="package-saving-info">Save up to ' + saving + '</b> when you book your Flight and Hotel together.',
                brandedDeal = null,
                brandedDeals = [],
                brandedDealVariation = null,
                eligibleBrandedDeals = [
                    'FREE_FLIGHT', 'HOTEL_DEAL', 'FREE_HOTEL', 'FREE_HOTEL_NIGHTS'
                ];

            packageModels = packageModels || [];

            if (packageModels.length > 0) {

                saving = decodeURIComponent(packageModels[0].savingsNoDecimal);
                changeHotelUrl = packageModels[0].urlToPackageSearch + "&hotelIds=" + packageModels[0].hotelModel.hotelId;

                $.each(packageModels, function(packageDealKey, packageDeal) {

                    brandedDeals = packageDeal.brandedDeals || [];

                    $.each(brandedDeals, function (key, value) {

                        if (-1 < $.inArray(value.brandedDealVariation, eligibleBrandedDeals)) {
                            brandedDeal = packageDeal;
                            brandedDealVariation = value;
                            return false;
                        }
                    });

                    if (null !== brandedDealVariation) {
                        return false;
                    }
                });

                data = {
                    'saving': saving,
                    'savingValue': packageModels[0].savingsValue,
                    'crossSellUrl': changeHotelUrl,
                    'crossSellDeal': packageModels[0],
                    'xSellDescription': xSellDescription,
                    'brandedDeal': brandedDeal,
                    'brandedDealVariation': brandedDealVariation
                };

                omnitureData = this.retrieveOmnitureTrackData(data);

                data = $.extend(data, omnitureData);

                this.crossSellModel.set(data);

            } else {

                this.crossSellModel.set(this.crossSellModel.defaults);
            }
            // Triggering another event, because resetting to default sometimes doesn't trigger change as the model was already at default hash, but we need to notify the views and act accordingly
            this.crossSellModel.trigger('crossSellModel.updated');
            // This is for ForceChoiceModalView, which is not tied to any backbone model yet, so once ForceChoiceModalView has a reference of CrossSellModel this can be removed.
            flights.vent.trigger('crossSellModel.updated',  {
                crossSellModel: this.crossSellModel
            });
        },


        retrieveOmnitureTrackData: function(model) {

            var packageSavingAmountStr = '',
                packageSavingAmount = 0,
                totalPriceValueStr = '',
                totalPriceValue = 0,
                totalPriceForStandaloneComponents = 0,
                percentSavings = 0,
                hotelId = '',
                dctkVariable = '',
                trackImpressionEvent = 'event57',
                packageDeal = model.crossSellDeal,
                isBrandedDeal = (null !== model.brandedDeal),
                dctkVariableBrandedDealModifier;

            if (isBrandedDeal) {
                packageDeal = model.brandedDeal;
            }

            hotelId = decodeURIComponent(packageDeal.hotelModel.hotelId);
            packageSavingAmountStr = decodeURIComponent(packageDeal.savingsValue);
            totalPriceValueStr = decodeURIComponent(packageDeal.totalPriceValue);
            packageSavingAmount = parseFloat(packageSavingAmountStr, 10);
            totalPriceValue = parseFloat(totalPriceValueStr, 10);

            if (!isNaN(packageSavingAmount) && !isNaN(totalPriceValue)) {

                totalPriceForStandaloneComponents = totalPriceValue + packageSavingAmount;
                percentSavings = Math.round(packageSavingAmount / totalPriceForStandaloneComponents * 100);
                packageSavingAmount = Math.round(packageSavingAmount / 10) * 10;
                dctkVariable = 'N:' + packageSavingAmount + ':' + percentSavings + ':' + (isBrandedDeal ? 'Y' : 'N');

                if(isBrandedDeal && model.brandedDealVariation && model.brandedDealVariation.brandedDealVariation){
                    dctkVariableBrandedDealModifier = ':' + model.brandedDealVariation.brandedDealVariation;
                }
            }

            // store tracking parameters in Model to access later for impression and click tracking
            return {
                omnitureImpressionTrackVar: {
                    products:'PkgHotel;Merchant PkgHotel:' + hotelId + ';;;' + trackImpressionEvent + '=1;eVar59=' + dctkVariable
                },
                omnitureClickTrackVar: {
                    products:'PkgHotel;Merchant PkgHotel:' + hotelId + ';;;' + 'event58=1;' + 'eVar59=' + dctkVariable,
                    eVar59:dctkVariable
                },
                dctkVariableBrandedDealModifier: dctkVariableBrandedDealModifier
            };
        }
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/CrossSellModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

/* Due to an incompatibility between Backbone and Modulizr, we are
 * using Backbone in the global namespace rather than make it an AMD
 * dependency.
 */

define('crossSellModel', ['flights', 'analytics', 'configuration', 'backbone'], function(flights, analytics, configuration, Backbone) {

    'use strict';

    return Backbone.Model.extend({

        defaults : {
            saving: '',
            crossSellUrl: '',
            packageModels: []
        },

        hideLivePricingLoader: function() {

            // hideLivePricing loader after first call, even if the call fails
            return this.doesLivePricingExist();
        },

        doesLivePricingExist: function() {

            var formattedSavings = this.get('saving') || '',
                exactSaving = this.get('savingValue') || -1,
                threshold = configuration.xsell.hotel.livePricing.threshold;

            return ('' !== formattedSavings && exactSaving > threshold);
        },

        doesBrandedDealExist: function () {

            var brandedDeal = this.get('brandedDeal') || '';

            return ('' !== brandedDeal);
        },

        logOmnitureImpressionTrackData: function(trackId) {
            var trackImpressionEvent = 'event57',
                impressionTrackVar = this.get('omnitureImpressionTrackVar'),
                dctkVariableBrandedDealModifier = this.get('dctkVariableBrandedDealModifier');

            if ('undefined' !== impressionTrackVar) {

                if(configuration.xsell.hotel.livePricing.brandedDealEnabled === true){
                    impressionTrackVar.products += dctkVariableBrandedDealModifier;
                }

                analytics.trackImpression(
                    trackId,
                    impressionTrackVar,
                    trackImpressionEvent
                );
            }
        },

        logOmnitureClickTrackData: function(trackId, target) {
            var trackClickEvent = 'event58',
                clickTrackVar = this.get('omnitureClickTrackVar'),
                dctkVariableBrandedDealModifier = this.get('dctkVariableBrandedDealModifier');

            if ('undefined' !== clickTrackVar){

                if(configuration.xsell.hotel.livePricing.brandedDealEnabled === true){
                    clickTrackVar.products += dctkVariableBrandedDealModifier;
                    clickTrackVar.eVar59 += dctkVariableBrandedDealModifier;
                }

                analytics.trackAction(trackId, target, clickTrackVar, trackClickEvent);
            }
        }
    });
});

/* static_content/default/default/scripts/exp/flights/flux/models/FlightDeltaModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('flightDeltaModel', ['flights', 'jquery', 'configuration', 'backbone'], function(flights, $, configuration, Backbone) {
    'use strict';

    return Backbone.Model.extend({
		url: '/api/userhistory/airsearchdeltainteraction',
        timeout: 10000,
        historyModel : {},
		deltaModel: {'deltaModelAvailable' : false},
        request : {},
		isUserRegistered : "",
		initialize: function(singlePageModel) {
            this.initializeRequest(singlePageModel);
			this.isUserRegistered = singlePageModel.get('isUserRegistered');
        },
        initializeRequest: function(singlePageModel) {
            this.request = {
				'departureAirport' : singlePageModel.get('departureAirportCode'),
				'arrivalAirport' : singlePageModel.get('arrivalAirportCode'),
				'apwMaxDays' : 0,
				'departureISODate' :  singlePageModel.get('departureISODate'), 
				'arrivalISODate' : singlePageModel.get('arrivalISODate'),
				'routeTypeName' : "ROUND_TRIP"
            };
        },  
		
		fetchFlightHistories: function() {
            var self = this;
			if(configuration.scratchpadModal.flightDelta.isSearchMatchAPW && !configuration.scratchpadModal.flightDelta.trackChange && configuration.scratchpadModal.flightDelta.continuousShoppingApwPlusPriceDeltaEnabled){
				
				this.fetch({
					type: "POST",
					contentType: "application/json",
					dataType: 'json',
	                data: JSON.stringify(this.request),
					timeout: this.timeout,
	                success: function (model, response, options) {
						var parsedResponse = JSON.parse(response);
						if("SUCCESS"===parsedResponse.deltaMessageStatus && self.helper.shouldShowDelta(parsedResponse.searchTime)){
							self.historyModel.priceAmount = parsedResponse.priceAmount;
							self.historyModel.currencySymbol = parsedResponse.currencySymbol;
							self.historyModel.formattedPrice = parsedResponse.formattedPrice;
							self.historyModel.searchDate = parsedResponse.searchDate;
							self.historyModel.historyModelAvailable = true;
						}
	                },
	                error: function (model, response, options) {
						self.historyModel.historyModelAvailable = false;
	                }
	            });
			}
        },
		
		setPriceDeltaModelDetail : function(searchResultsModel) {
			var self = this,
				cheapestPriceOfCurrentSearch,
				priceDelta;
			cheapestPriceOfCurrentSearch = self.helper.getCheapestPriceOfCurrentSearch(searchResultsModel);
			if(undefined === cheapestPriceOfCurrentSearch || true !== self.historyModel.historyModelAvailable){
				return;
			}
			priceDelta = Math.round((cheapestPriceOfCurrentSearch - self.historyModel.priceAmount) * 100) / 100;
			self.deltaModel.priceAmount = cheapestPriceOfCurrentSearch;
			self.deltaModel.priceDeltaAmount = priceDelta;
			self.deltaModel.priceDelta = self.helper.formatPriceDelta(self.historyModel.currencySymbol, priceDelta);
			self.deltaModel.priceChange = self.helper.hasChanged(priceDelta);
			self.deltaModel.searchDate = self.historyModel.searchDate;
			self.deltaModel.deltaModelAvailable = true;
		},
			
		helper: {
			getCheapestPriceOfCurrentSearch: function(searchResultsModel) {
				var offers = searchResultsModel.get('offers'),
					indexes = searchResultsModel.get('index'),
					cheapestPriceAmount;

				if (undefined !== offers) {
					$.each(indexes, function(i, naturalOfferKey){ 
						var offer = offers[naturalOfferKey];
						if(!offer.bargainOffer){
							cheapestPriceAmount = offer.price.exactPrice;
							return false;
						}
					});
				}
				return cheapestPriceAmount;
			},
			
			hasChanged: function(priceDelta) {
					if (priceDelta > 0) {
						return 1; // increased
					}
					if (priceDelta < 0) {
						return -1; // decreased
					} 
					if(priceDelta ===0){
						return 0; // unchanged
					}
			},
		
			formatPriceDelta: function(currencySymbol, priceDelta) {
				if (priceDelta === 0) {
					return "";
				}
				var parsedPriceDelta = currencySymbol + Math.abs(priceDelta),
					decimalIndex = parsedPriceDelta.indexOf(".");
				parsedPriceDelta = decimalIndex !== -1 && parsedPriceDelta.substr(decimalIndex).length === 2 ? parsedPriceDelta + "0" : parsedPriceDelta;
				return parsedPriceDelta;
			},
			
			shouldShowDelta: function(lastSearchTime) {
        		//Do not display a price delta message it is a user repeating a search and the last search was done less than 5 minutes ago.
        		return (new Date().getTime() - lastSearchTime) > (configuration.scratchpadModal.flightDelta.timeElapsedSinceLastSearch * 60 * 1000);
        	}
		}
    });
	
});
/* static_content/default/default/scripts/exp/flights/flux/views/FlightDeltaView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('flightDeltaView'
	, ['flights', 'jquery', 'flightDeltaModel', 'handlebars', 'scratchpadModal', 'singlePageModel', 'configuration', 'analytics', 'backbone', 'i18n']
	, function(flights, $, FlightDeltaModel, handlebars, ScratchpadModal, SinglePageModel, configuration, analytics, Backbone, i18n) {
    'use strict';

    return Backbone.View.extend({
		singlePageModel : new SinglePageModel(),
		flightDeltaModel : {},
		initialize: function() {
            var self = this;

            self.flightDeltaModel = new FlightDeltaModel(self.singlePageModel);
            self.flightDeltaModel.fetchFlightHistories();

            self.listenTo(flights.vent, 'uiModel.resultsFetchSuccess', function(options){
                self.renderFlightDeltaView(options.model);
            });
		},

		renderFlightDeltaView : function(searchResultsModel){
			var self = this;
    		
			self.flightDeltaModel.setPriceDeltaModelDetail(searchResultsModel);
			if(configuration.scratchpadModal.flightDelta.isSearchMatchAPW){
				if(true === configuration.scratchpadModal.flightDelta.continuousShoppingApwPlusPriceDeltaEnabled){
					self.renderApwCombinePriceDeltaOptinModal();
				}else{
					self.renderApwOptinModal();
				}
			}else{
				self.renderDefaultOptinModal();
			}
		},
		
		getCheapestPriceOfCurrentSearch : function(searchResultsModel){
			var price = this.flightDeltaModel.helper.getCheapestPriceOfCurrentSearch(searchResultsModel);
			return price;
		},
	 
		renderPriceDeltaOptinModal : function(){
			// Opened scratchpadOptin modal for updating price delta or duration delta.
			var scratchpadOptinStatus = ScratchpadModal.model.sessionStorage.readJSONAsObject('scratchpadOptinStatus'),
			deltaModel = this.flightDeltaModel.deltaModel;
			if( ScratchpadModal.model.userScratchpadOptinActivity.MAYBE_LATER !== scratchpadOptinStatus){
				if($('a#scratchpadOptin').length > 0){
					$('a#scratchpadOptin').addClass('visually-hidden');
		        }
				ScratchpadModal.showOptinModal(true);
		   		if($('#scratchpadOptin-title').length > 0){
            		$('#scratchpadOptin-title').attr('aria-live','assertive');
            	}
				deltaModel.flightPriceDeltaTextTemplate = handlebars.templates.flightPriceDeltaTextTemplate({
						deltaModel: deltaModel
				});
				$('#flightPriceDeltaTextDiv').html(deltaModel.flightPriceDeltaTextTemplate);

				$('#scratchpadOptin.modal-wrap').addClass('left-aligned');
				$('#send-me-notes-button span.btn-label').html($('#trackChangesLink').val());
				$('#scratchpadOptin.modal-wrap a.modal-close').text($('#maybeLaterLink').val());
            	
				if (0 === deltaModel.priceChange) {
					$('#scratchpadOptin-title').html($('#headerUnchangedText').val());
					$('#scratchpadOptin.modal-wrap div.modal-body p').html($('#bodyUnchangedInfoText').val());
					uitk.utils.liveAnnounce($('#headerUnchangedText').val());
					this.omnitureTracking('PriceNC');
            		
				} else if (1 === deltaModel.priceChange) {
					$('#scratchpadOptin.modal-wrap div.modal-body p').html($('#bodyChangedInfoText').val());
					$('#scratchpadOptin.modal-wrap div.modal-body').addClass('delta-padding');
					$('#scratchpadOptin-title').html('<div class="delta-icon"><img src="/static/default/default/images/scratchpad/up-60px.png" height="36px" width="36px" alt="up arrow"/></div><div class="delta-text">' + $('#headerPriceUpText').val() + '</div>');
					uitk.utils.liveAnnounce($('#bodyChangedInfoText').val());
					this.omnitureTracking('PriceUp');
    				
				} else {
					$('#scratchpadOptin.modal-wrap div.modal-body p').html($('#bodyChangedInfoText').val());
					$('#scratchpadOptin.modal-wrap div.modal-body').addClass('delta-padding');
					$('#scratchpadOptin-title').html('<div class="delta-icon"><img src="/static/default/default/images/scratchpad/down-60px.png" height="36px" width="36px" alt="down arrow"/></div><div class="delta-text">' + $('#headerPriceDownText').val() + '</div>');
					uitk.utils.liveAnnounce($('#bodyChangedInfoText').val());
					this.omnitureTracking('PriceDown');
				}
			}
            
		},
		
		renderApwOptinModal: function(){
			ScratchpadModal.afterSearchSuccess();
		},
		
		renderGenericOptinModal: function(){
			ScratchpadModal.afterSearchSuccess();
		},
		
		renderDefaultOptinModal: function(){
			 var priceDeltaAvailable = this.flightDeltaModel.deltaModel.deltaModelAvailable === true;
			 if(priceDeltaAvailable){
				 this.renderPriceDeltaOptinModal();
			 }else{
				 this.renderGenericOptinModal();
			 }
		},
		
		//For Flight price < $200, if price delta is >10% of price, show price delta else show APW Message 
		//For Flight price >= $200, if price delta is > 5% of price, show price delta, else show APW Message
		renderApwCombinePriceDeltaOptinModal: function(){
		     var priceDeltaAmount = this.flightDeltaModel.deltaModel.priceDeltaAmount,
		    	 priceAmount = this.flightDeltaModel.deltaModel.priceAmount,
		    	 priceThreshold = configuration.scratchpadModal.flightDelta.continuousShoppingPriceThreshold,
		    	 growthRateGtCSPriceThreshold = configuration.scratchpadModal.flightDelta.growthRateGtCSPriceThreshold,
		    	 growthRateLtCSPriceThreshold = configuration.scratchpadModal.flightDelta.growthRateLtCSPriceThreshold;
		    	 
		    	 if(priceDeltaAmount > 0){
		    		 if(priceAmount >= priceThreshold && Math.abs(priceDeltaAmount) > growthRateGtCSPriceThreshold * priceAmount / 100){
		    			 this.renderPriceDeltaOptinModal();
		    		 }else if(priceAmount <priceThreshold && Math.abs(priceDeltaAmount) > growthRateLtCSPriceThreshold * priceAmount / 100){
		    			 this.renderPriceDeltaOptinModal();
		    		 }else{
		    			 this.renderApwOptinModal();
		    		 }
		    	 }else if(priceDeltaAmount < 0){
		    		 this.renderPriceDeltaOptinModal();
		    	 }else{
		    		 this.renderApwOptinModal();
		    	 }
		 },
		 
		 omnitureTracking: function(priceChange){
			 var optin = $('#scratchpadOptin.modal-wrap'),
			     mayBeLater = optin.find('a.modal-close'),
			     closeButton = optin.find('button.modal-close'),
			     trackChanges = $('#send-me-notes-button'),
			     mayBeLaterTag = 'FLT.SR.PriceChange.ScratchpadMaybeLaterLink.Select',
			     closeButtonTag = 'FLT.SR.PriceChange.ScratchpadModalClose.Close',
			     trackChangesTag = 'FLT.SR.PriceChange.ScratchpadTrackChanges.Select',
			     trackImpressionTag = 'FLT.SR.PriceChange.ScratchpadInOpt';
			    	 
			 mayBeLater.addClass('click-handler-range').attr('data-omniture-rfrr', mayBeLaterTag.replace('PriceChange', priceChange));
			 closeButton.addClass('click-handler-range').attr('data-omniture-rfrr', closeButtonTag.replace('PriceChange', priceChange));
			 trackChanges.addClass('click-handler-range').attr('data-click-handler','createPriceAlertScratchpadModal,omnitureClickHandler').attr('data-omniture-rfrr', trackChangesTag.replace('PriceChange', priceChange));
			 
			 analytics.trackImpression("Scratchpad Modal Impression", { eVar28: trackImpressionTag.replace('PriceChange', priceChange)});
		 }
		
    });
	
});

/* static_content/default/default/scripts/exp/flights/searchResults/priceTrendsChart.js */
/*global define, google, window */

define('priceTrendsChart', ['jquery', 'i18n', 'analytics', 'dctk/dctk', 'handlebars', 'configuration'], function ($, i18n, analytics, dctk, handlebars, configuration) {
    'use strict';

    var priceTrendsChart;

    function logMessage(message) {
        if (dctk && dctk.logging && dctk.logging.logMessage) {
            dctk.logging.logMessage(message);
        }
    }

    function addThousandSeparator(numStr, config) {
        var numParts = numStr.split('.'),
            wholePart = numParts[0],
            decimalPart = numParts.length > 1 ? '.' + numParts[1] : '',
            rgx = /(\d+)(\d{3})/;

        while (rgx.test(wholePart)) {
            wholePart = wholePart.replace(rgx, '$1' + config.thousandSeparator + '$2');
        }

        return wholePart + decimalPart;
    }

    function getDate(dateString) {
        var d = new Date(dateString);

        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
    }

    function getYesterday() {
        var d = new Date();

        d.setDate(d.getDate() - 1);

        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
    }

    function getPrice(price) {
        return Math.round(price);
    }

    function getAbsDiffInDays(dateA, dateB) {
        var diffInMillis = dateA - dateB;

        return Math.abs(diffInMillis / 1000 / 60 / 60 / 24);
    }

    function getPriceDelta(response) {
        var priceTrendsFirst = 0,
            priceTrendsLast = response.priceTrends.trendsList.length - 1;

        return Math.abs(response.priceTrends.trendsList[priceTrendsFirst].averagePrice - response.priceTrends.trendsList[priceTrendsLast].averagePrice);
    }

    function getFormattedSearchCount(searchCount, config) {
        return addThousandSeparator(searchCount.toString(), config);
    }

    function getFormattedPrice(amount, config) {
        var numberFormat = new google.visualization.NumberFormat({pattern: config.priceFormatPattern});

        return numberFormat.formatValue(amount);
    }

    function getFormattedDate(date, config) {
        var dateFormat = new google.visualization.DateFormat({pattern: config.dateFormatPattern});

        return dateFormat.formatValue(date);
    }

    function getPriceTrendType(response, config) {
        var firstPrice = response.priceTrends.trendsList[0].averagePrice,
            lastPrice = response.priceTrends.trendsList[response.priceTrends.trendsList.length - 1].averagePrice;

        if (firstPrice >= lastPrice + config.priceTrendDelta) {
            return config.priceTrendFall;
        }

        if (lastPrice >= firstPrice + config.priceTrendDelta) {
            return config.priceTrendRise;
        }

        return config.priceTrendUnchanged;
    }

    priceTrendsChart = {
        data: null,
        createPriceAlertLoaderTimer: null,
        submitted: '',
        mainConfig: null,
        $graphContainer: null,

        renderGraph: function (options) {
            var config,
                self = this;

            if (options === undefined) {
                logMessage('Options is undefined and we can\'t render the graph.');
                return;
            }

            config = options.config;
            this.mainConfig = options.mainConfig;

            $.ajax({
                url: '/priceTrends',
                type: 'GET',
                cache: false,
                dataType: 'json',
                timeout: 5000,
                data: {
                    origin: config.departureAirportCode,
                    destination: config.arrivalAirportCode,
                    departureDate: config.departureDate,
                    tpid: config.tpid,
                    eapid: config.eapid
                },
                success: function (response) {
                    var processedResponse;

                    if (!self.isResponseValid(response)) {
                        logMessage('The response from the service is invalid.');
                        return;
                    }

                    processedResponse = self.processResponse(response);

                    if (!self.isProcessedResponseValidForChart(processedResponse)) {
                        logMessage('There is not enough data to render chart.');
                        return;
                    }

                    if (typeof options.callbackLoadApi === 'function') {
                        self.loadChartApi(config, processedResponse, options.callbackLoadApi);
                    } else {
                        self.loadChartApi(config, processedResponse);
                    }

                    if (typeof options.success === 'function') {
                        options.success();
                    }
                },
                error: function () {
                    logMessage('Failed to get response from Price Trends service.');
                    if (typeof options.error === 'function') {
                        options.error();
                    }
                },
                complete: function () {
                    if (typeof options.complete === 'function') {
                        options.complete();
                    }
                }
            });
        },

        isResponseValid: function (response) {
            return response.priceTrends && response.priceTrends.searchCount;
        },

        processResponse: function (response) {
            var yesterday,
                trendsList = [],
                searchDate,
                i = 0;

            if (response.priceTrends.yesterday) {
                yesterday = new Date(response.priceTrends.yesterday.year, response.priceTrends.yesterday.month, response.priceTrends.yesterday.day, 0, 0, 0, 0);
            } else {
                yesterday = getYesterday();
            }

            for (i = 0; i < response.priceTrends.trendsList.length; i++) {
                searchDate = getDate(response.priceTrends.trendsList[i].searchDate);
                if (getAbsDiffInDays(yesterday, searchDate) <= this.mainConfig.daysDelta) {
                    trendsList[trendsList.length] = {
                        searchDate: searchDate,
                        averagePrice: getPrice(response.priceTrends.trendsList[i].averagePrice)
                    };
                }
            }

            response.priceTrends.trendsList = trendsList;

            return response;
        },

        isProcessedResponseValidForChart: function (response) {
            return response.priceTrends && response.priceTrends.status === 'success' &&
                response.priceTrends.trendsList && response.priceTrends.trendsList.length > 1;
        },

        insertBeginningDataPointIfMissing: function (response, dataTable, dateColumnIndex) {
            var yesterday = getYesterday(),
                rowIndex,
                beginningDate,
                columnIndex;

            if (getAbsDiffInDays(yesterday, response.priceTrends.trendsList[0].searchDate) < this.mainConfig.daysDelta) {
                beginningDate = new Date(yesterday);
                beginningDate.setDate(yesterday.getDate() - this.mainConfig.daysDelta);

                rowIndex = 0;
                dataTable.insertRows(rowIndex, 1);

                dataTable.setValue(rowIndex, dateColumnIndex, beginningDate);

                columnIndex = dataTable.addColumn('number', 'uncertain');
                dataTable.setValue(rowIndex, columnIndex, response.priceTrends.trendsList[0].averagePrice);
                dataTable.setValue(rowIndex + 1, columnIndex, response.priceTrends.trendsList[0].averagePrice);
            }
        },

        insertEndDataPointIfMissing: function (response, dataTable, dateColumnIndex) {
            var yesterday = getYesterday(),
                rowIndex,
                columnIndex,
                lastPriceTrendsIndex = response.priceTrends.trendsList.length - 1;

            if (getAbsDiffInDays(yesterday, response.priceTrends.trendsList[lastPriceTrendsIndex].searchDate) > 0) {
                rowIndex = dataTable.addRows(1);

                dataTable.setValue(rowIndex, dateColumnIndex, yesterday);

                columnIndex = dataTable.addColumn('number', 'uncertain');
                dataTable.setValue(rowIndex - 1, columnIndex, response.priceTrends.trendsList[lastPriceTrendsIndex].averagePrice);
                dataTable.setValue(rowIndex, columnIndex, response.priceTrends.trendsList[lastPriceTrendsIndex].averagePrice);
            }
        },

        insertBeginningIntoMergedTableIfMissing: function (response, mergedDataTable, mergedTableDateColumnIndex, mergedTablePriceColumnIndex) {
            var yesterday = getYesterday(),
                beginningDate,
                rowIndex;

            if (getAbsDiffInDays(yesterday, response.priceTrends.trendsList[0].searchDate) < this.mainConfig.daysDelta) {
                beginningDate = new Date(yesterday);
                beginningDate.setDate(yesterday.getDate() - this.mainConfig.daysDelta);
                rowIndex = 0;
                mergedDataTable.insertRows(rowIndex, 1);
                mergedDataTable.setValue(rowIndex, mergedTableDateColumnIndex, beginningDate);
                mergedDataTable.setValue(rowIndex, mergedTablePriceColumnIndex, response.priceTrends.trendsList[0].averagePrice);
            }
        },

        insertEndIntoMergedTableIfMissing: function (response, mergedDataTable, mergedTableDateColumnIndex, mergedTablePriceColumnIndex) {
            var yesterday = getYesterday(),
                rowIndex,
                lastPriceTrendsIndex = response.priceTrends.trendsList.length - 1;

            if (getAbsDiffInDays(yesterday, response.priceTrends.trendsList[lastPriceTrendsIndex].searchDate) > 0) {
                rowIndex = mergedDataTable.addRows(1);
                mergedDataTable.setValue(rowIndex, mergedTableDateColumnIndex, yesterday);
                mergedDataTable.setValue(rowIndex, mergedTablePriceColumnIndex, response.priceTrends.trendsList[lastPriceTrendsIndex].averagePrice);
            }
        },

        loadChartApi: function (config, response, callback) {
            var self = this;

            $.getScript('https://www.google.com/jsapi')
                .done(function () {
                    google.load('visualization', '1', {
                        callback: function () {
                            self.data = self.createData(response);
                            self.renderAfterElement(config);
                            if (self.data.chartData) {
                                self.setContainer();
                                self.renderChart();
                                $(window).resize(function () {
                                    self.redrawChart();
                                });
                            }
                            if (typeof callback === 'function') {
                                callback();
                            }
                        },
                        packages: ['corechart'],
                        language: 'en'
                    });
                })
                .fail(function () {
                    logMessage('Failed to load google jsapi.');
                });
        },

        createData: function (response) {
            var chartData = this.createChartData(response);

            return {
                chartData: chartData,
                templateData: this.createTemplateData(response, chartData),
                response: response
            };
        },

        createChartData: function (response) {
            var mergedDataTable,
                mergedTableDateColumnIndex,
                mergedTablePriceColumnIndex,
                dataTable,
                dateColumnIndex,
                currColumnIndex,
                prevLabel,
                currDate,
                nextDate,
                i = 1,
                trendsListLength;

            if (this.isProcessedResponseValidForChart(response)) {
                mergedDataTable = new google.visualization.DataTable();
                mergedTableDateColumnIndex = mergedDataTable.addColumn('date', 'Date');
                mergedTablePriceColumnIndex = mergedDataTable.addColumn('number', 'Price');

                mergedDataTable.addRow([response.priceTrends.trendsList[0].searchDate, response.priceTrends.trendsList[0].averagePrice]);
                dataTable = new google.visualization.DataTable();
                dataTable.addRows(response.priceTrends.trendsList.length);
                dateColumnIndex = dataTable.addColumn('date', 'Date');
                currColumnIndex = 1;
                prevLabel = 'undefined';
                currDate = response.priceTrends.trendsList[0].searchDate;
                dataTable.setValue(0, dateColumnIndex, currDate);

                for (i = 1, trendsListLength = response.priceTrends.trendsList.length; i < trendsListLength; i++) {
                    nextDate = response.priceTrends.trendsList[i].searchDate;
                    dataTable.setValue(i, dateColumnIndex, nextDate);
                    if (getAbsDiffInDays(currDate, nextDate) <= 1) {
                        if (prevLabel === 'certain') {
                            dataTable.setValue(i, currColumnIndex, response.priceTrends.trendsList[i].averagePrice);
                        } else {
                            currColumnIndex = dataTable.addColumn('number', 'certain');
                            dataTable.setValue(i - 1, currColumnIndex, response.priceTrends.trendsList[i - 1].averagePrice);
                            dataTable.setValue(i, currColumnIndex, response.priceTrends.trendsList[i].averagePrice);
                        }
                    } else if (prevLabel === 'uncertain') {
                        dataTable.setValue(i, currColumnIndex, response.priceTrends.trendsList[i].averagePrice);
                    } else {
                        currColumnIndex = dataTable.addColumn('number', 'uncertain');
                        dataTable.setValue(i - 1, currColumnIndex, response.priceTrends.trendsList[i - 1].averagePrice);
                        dataTable.setValue(i, currColumnIndex, response.priceTrends.trendsList[i].averagePrice);
                    }

                    mergedDataTable.addRow([response.priceTrends.trendsList[i].searchDate, response.priceTrends.trendsList[i].averagePrice]);
                    prevLabel = dataTable.getColumnLabel(currColumnIndex);
                    currDate = nextDate;
                }
                this.insertBeginningDataPointIfMissing(response, dataTable, dateColumnIndex);
                this.insertEndDataPointIfMissing(response, dataTable, dateColumnIndex);
                this.insertBeginningIntoMergedTableIfMissing(response, mergedDataTable, mergedTableDateColumnIndex, mergedTablePriceColumnIndex);
                this.insertEndIntoMergedTableIfMissing(response, mergedDataTable, mergedTableDateColumnIndex, mergedTablePriceColumnIndex);

                return {dataTable: dataTable, mergedDataTable: mergedDataTable};
            }

            logMessage('There is not enough data to render chart.');

            return null;
        },

        createTemplateData: function (response, chartData) {
            var minDate,
                minPrice,
                maxPrice,
                priceDelta;

            if (chartData) {
                minDate = chartData.mergedDataTable.getColumnRange('Date').min;
                minPrice = chartData.mergedDataTable.getColumnRange('Price').min;
                maxPrice = chartData.mergedDataTable.getColumnRange('Price').max;
                priceDelta = getPriceDelta(response);

                return {
                	priceAlertsVariant: configuration.priceAlerts.variant,
                    chart: {
                        formattedPrice: getFormattedPrice(priceDelta, this.mainConfig),
                        formattedSinceDate: getFormattedDate(minDate, this.mainConfig),
                        priceTrendType: getPriceTrendType(response, this.mainConfig),
                        formattedMinDate: getFormattedDate(minDate, this.mainConfig),
                        formattedMaxDate: i18n.priceTrendsModal.priceTrendYesterday,
                        formattedMinPrice: getFormattedPrice(minPrice, this.mainConfig),
                        formattedMaxPrice: getFormattedPrice(maxPrice, this.mainConfig)
                    },
                    orig: response.priceTrends.origin,
                    dest: response.priceTrends.destination
                };
            }

            return {
                formattedSearchCount: getFormattedSearchCount(response.priceTrends.searchCount, this.mainConfig)
            };
        },

        renderAfterElement: function (config) {
            config.afterElement.after(handlebars.templates.priceTrendsChart(this.data.templateData));
        },

        renderChart: function () {
            var minDate = this.data.chartData.mergedDataTable.getColumnRange('Date').min,
                maxDate = this.data.chartData.mergedDataTable.getColumnRange('Date').max,
                minPrice = this.data.chartData.mergedDataTable.getColumnRange('Price').min,
                maxPrice = this.data.chartData.mergedDataTable.getColumnRange('Price').max,
                chartContainer = this.getContainer(),
                options = null,
                chart = null,
                horizontalAxisLabels,
                containerWidth = chartContainer.width(),
                containerHeight = chartContainer.height(),
                lineColor = '#4f4f4f',
                numberOfSeries,
                series = [],
                label,
                i;

            if (this.data.templateData.chart.priceTrendType === this.mainConfig.priceTrendFall) {
                lineColor = '#477a00';
            } else if (this.data.templateData.chart.priceTrendType === this.mainConfig.priceTrendRise) {
                lineColor = '#b80000';
            }

            numberOfSeries = this.data.chartData.dataTable.getNumberOfColumns() - 1;

            for (i = 0; i < numberOfSeries; i++) {
                label = this.data.chartData.dataTable.getColumnLabel(i + 1);
                if (label === 'certain') {
                    series[series.length] = {
                        color: lineColor,
                        pointsVisible: false
                    };
                } else {
                    series[series.length] = {
                        color: lineColor,
                        pointsVisible: false,
                        lineDashStyle: [4, 4]
                    };
                }
            }

            options = {
                series: series,
                lineWidth: 4,
                legend: {
                    position: 'none'
                },
                hAxis: {
                    baseline: minDate,
                    baselineColor: '#e5e5e5',
                    format: this.mainConfig.dateFormatPattern,
                    gridlines: {
                        color: '#ffffff',
                        count: 2
                    },
                    ticks: [minDate, {
                        v: maxDate,
                        f: 'Yesterday'
                    }]
                },
                vAxis: {
                    baseline: minPrice,
                    baselineColor: '#e5e5e5',
                    format: this.mainConfig.priceFormatPattern,
                    ticks: [minPrice, maxPrice],
                    gridlines: {
                        color: '#ffffff',
                        count: 2
                    },
                    textStyle: {
                        bold: true,
                        fontSize: 16
                    }
                },
                tooltip: {
                    trigger: 'none'
                },
                chartArea: {
                    left: 50,
                    top: 10,
                    width: containerWidth - 100,
                    height: containerHeight - 50
                }
            };
            chartContainer.empty();
            chart = new google.visualization.LineChart(chartContainer[0]);
            chart.draw(this.data.chartData.dataTable, options);
            horizontalAxisLabels = chartContainer.find('text[text-anchor=middle]');
            horizontalAxisLabels.eq(0).css('textAnchor', 'start');
            horizontalAxisLabels.eq(1).css('textAnchor', 'end');
        },

        redrawChart: function () {
            var $priceTrendsChart = this.getContainer();

            if ($priceTrendsChart.length) {
                $priceTrendsChart.empty();
                this.renderChart();
            }
        },

        logNumberOfValidDataPoints: function (modal) {
            var numberOfValidDataPoints = this.data.response.priceTrends.trendsList.length;

            analytics.trackAction('FLT.SR.SeePriceTrends.Insights.' + numberOfValidDataPoints, modal);
        },

        getContainer: function () {
            return this.$graphContainer;
        },

        setContainer: function ($contentFeature) {
            if ($contentFeature) {
                this.$graphContainer = $contentFeature;
            } else {
                this.$graphContainer = $('#priceTrendsGraphChart');
            }
        },

        setContentToAppend: function ($appendElement) {
            this.setContainer($appendElement);
            this.redrawChart();
        },

        setIconTrend: function ($elementIcon) {
            $elementIcon.html($('#priceTrendsIconTemplateModule').html());
        }

    };

    return priceTrendsChart;
});

/* static_content/default/default/scripts/exp/flights/flux/views/CrossSellOfferView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen:true */
/*global define, require, console */

define('crossSellOfferView'
    , ['flights', 'jquery', 'handlebars', 'standardOfferDetailsView', 'offerModel', 'backbone', 'experiments', 'baggageFeeView', 'uitk', 'analytics', 'configuration', 'sitebrand']
    , function(Flights, $, handlebars, StandardOfferDetailsView, OfferModel, Backbone, experiments, BaggageFeeView, uitk, analytics, configuration, siteBrand) {

    'use strict';

    // user closes the BrandedDeals tool tip
    $(document).on('click', '#brandedDealsToolTip a', function(event) {
        event.preventDefault();
        $('#crossSellOfferList .tooltip-messsage').uitk_tooltip('hide');
        analytics.trackAction('FLT.SR.BrandedDeal.Tooltip.GotIt', $(this));
    })

    // allow user to close BrandedDeals tool tip by hitting escape key
    var escapeBrandedDealTooltip = function(topic, $tooltip, event){
        if ($tooltip.attr('data-tooltip-id') === 'brandedDealsToolTip') {
            $tooltip.uitk_tooltip('hide');
        }
    }
    uitk.subscribe('tooltip.beforeClose', escapeBrandedDealTooltip);

    return Backbone.View.extend({

        tagName: 'li',
        className: 'flight-module segment click-handler-range differentiated-listing offer-listing',
        template: handlebars.templates.crossSellOffer,
        events: {
            'click .price-button-wrapper .crossselloffer' : 'selectFlightAndHotel',
            'click a.open-bag-fee': 'openBaggageFeeLink',
            'click a.tooltip-messsage.branded-deal': 'trackTooltipOpen'
        },
        crossSellOffer: null,
        baggageFeeView : null,

        initialize: function(options) {
            options.crossSellOffer.naturalKey = 'crossselloffer-' + options.crossSellOffer.naturalKey;
            this.crossSellOffer = new OfferModel(options.crossSellOffer);
            this.model = options.crossSellModel;
            this.id = 'crossselloffer-' + this.crossSellOffer.get('naturalKey').replace(/;/g, '_');
        },
        attributes : {
            'data-is-split-ticket' : 'splitTicket',
            'data-discount' : 'discount',
            'data-is-packageable' : 'packageable'
        },

        render: function () {
            var markup
                , self = this
                , saving = self.model.get('saving')
                , crossSellDeal = self.model.get('crossSellDeal')
                , brandedDeal = self.model.get('brandedDeal')
                , brandedDealVariation = self.model.get('brandedDealVariation')
                , brandedDealData
                , changeHotelURL = self.model.get('crossSellUrl')
                , data
                , seatingClass = Flights.Model.Wizard.seatingClass
                , seatingClassForUrl = ['','F','B','E','','P'],
                isBrandedDeal = (null !== brandedDeal),
                brandedDealMessageKey;
                
            if (null !== brandedDeal) {

                brandedDealData = {
                    numberOfNightsOfStay: brandedDeal.hotelModel.numberOfNightsOfStay,
                    brandedDealVariation : brandedDealVariation.brandedDealVariation,
                    numberOfFreeNights: brandedDealVariation.numNightsFree,
                    percentSavingOverFPlusHPrice: Math.floor(brandedDealVariation.percentSavingOverFPlusHPrice)
                };

                changeHotelURL = brandedDeal.urlToPackageSearch + "&hotelIds=" + brandedDeal.hotelModel.hotelId + "&cabinClass=" + seatingClassForUrl[seatingClass];
                saving = decodeURIComponent(brandedDeal.savingsNoDecimal);
            }

            brandedDealMessageKey = this.getBrandedDealMessage(isBrandedDeal, brandedDealData);

            data = {
                module: self.crossSellOffer.toJSON(),
                isBrandedDeal: isBrandedDeal,
                brandedDeal: brandedDealData,
                saving: saving,
                addHotelHREF: changeHotelURL,
                useTripStrings: configuration.route.isMultiDest,
                shouldUseMultipleBagFeeStrings: configuration.baggageFee.useMultipleBagFeeStrings,
                shouldUseHandBaggageOnlyMessage: configuration.baggageFee.useHandBaggageOnlyMessage,
                shouldUseThinListingBaggageFeeLink: configuration.baggageFee.useThinListingBaggageFeeLink,
                siteBrandName: siteBrand.brandname,
                brandedDealMessage: 'views_default_controls_flight_searchresults_flux_crossselloffer.' + brandedDealMessageKey,
                brandedDealMessageKey: brandedDealMessageKey
            };

            $.each(self.attributes, function(key,value) {self.$el.attr(key, self.crossSellOffer.get(value)); });

            this.standardOfferDetailsView = new StandardOfferDetailsView({
                model: self.crossSellOffer,
                el: self.el
            });
            this.baggageFeeView = new BaggageFeeView({model: {offer:  self.crossSellOffer}, el: self.el});

            markup = self.template(data);

            self.$el.html(markup);
            $('#crossSellOfferList').append(self.$el);
            $('#crossSellOfferList').removeClass('hide');
            if(brandedDeal !== null)
            {
                experiments.execute("TIMER_ON_BRANDED_DEALS.FLIGHT_STAND_ALONE", self.$el);
                experiments.execute('clickableBrandedDeal.render', self.$el);
            }
        },

        getBrandedDealMessage: function (isBrandedDeal, brandedDeal) {
            if (isBrandedDeal) {
                if (brandedDeal.brandedDealVariation === 'FREE_FLIGHT') {
                    return this.getFreeFlightMessageId(configuration.xsell.hotel.freeFlightMessageVariant);
                }
                if (brandedDeal.brandedDealVariation === 'FREE_HOTEL') {
                    return 'freeHotel';
                }
                if (brandedDeal.brandedDealVariation === 'HOTEL_DEAL') {
                    return 'hotelDeal';
                }
                if (brandedDeal.brandedDealVariation === 'FREE_HOTEL_NIGHTS') {
                    if (brandedDeal.numberOfFreeNights > 1) {
                        return 'freeHotelNights';
                    }

                    return 'freeHotelNight';
                }
            }
            return 'defaultTitle';
        },

        getFreeFlightMessageId: function (freeFlightMessageVariant) {
            switch (freeFlightMessageVariant) {
                case 'FREE_FLIGHT':
                    return 'freeFlight';
                case 'FREE_FLIGHT_SAVINGS_UP_TO':
                    return 'freeFlightSavingsUpTo';
                case 'FREE_FLIGHT_SAVINGS_EQUAL_TO':
                    return 'freeFlightSavingsEqualTo';
                case 'FREE_FLIGHT_LEGAL_DEFAULT':
                    return 'freeFlightLegalDefault';
                default:
                    return 'freeFlightLegalDefault';
            }
        },

        selectFlightAndHotel: function(target, event) {
            this.model.logOmnitureClickTrackData('FLT.SR.XSell.PKG.DifferentiatedListing', target);
        },

        empty: function () {
            $('#crossSellOfferList').empty();
        },

        openBaggageFeeLink: function(event){
            this.baggageFeeView.baggageFeeLinkHelper(event);
        },

        trackTooltipOpen: function(target){
            this.model.logOmnitureClickTrackData('FLT.SR.BrandedDeal.Tooltip.Open', target);
        }

    });
});


/* static_content/default/default/scripts/exp/flights/flux/views/PriceTrendsView.js */
/*jslint browser: true, for: true, multivar: true, single: true, this: true, white: true */
/*global define, require */

define('priceTrendsView', ['flights', 'jquery', 'configuration', 'backbone', 'singlePageModel', 'priceTrendsModal', 'fluxClickHandler', 'sitebrand'], function (flights, $, configuration, Backbone, SinglePageModel, priceTrendsModal, fluxClickHandler, sitebrand) {
    'use strict';

    return Backbone.View.extend({
        singlePageModel: new SinglePageModel(),

        initialize: function () {
            if (configuration.priceAlerts.variant > 0 && configuration.priceTrends.isFlightInsightAvailable) {
                fluxClickHandler.addHandler('showPriceTrendsModal', priceTrendsModal.showPriceTrendsModal, priceTrendsModal);
                fluxClickHandler.addHandler('getPriceAlerts', priceTrendsModal.getPriceAlerts, priceTrendsModal);
                this.listenTo(flights.vent, 'offersCollectionView.render', this.render);
            }
        },
        render: function () {
            var position = this.getRenderPosition();

            if (position <= 0 || configuration.pageName === 'page.Flight-Search-Roundtrip.In') {
                this.clear();
                return;
            }

            priceTrendsModal.render({
                tpid: sitebrand.tpid,
                eapid: sitebrand.eapid,
                arrivalAirportCode: this.singlePageModel.get('arrivalAirportCode'),
                departureAirportCode: this.singlePageModel.get('departureAirportCode'),
                departureDate: this.singlePageModel.get('departureISODate'),
                afterElement: $('#flightModuleList').find('.flight-module:visible').eq(position - 1)
            });
        },
        clear: function () {
            if (priceTrendsModal.$el !== undefined) {
                priceTrendsModal.$el.remove();
            }
        },
        getRenderPosition: function () {
            var totalResults = $('#flightModuleList').find('.flight-module:visible').length,
                position = configuration.priceTrends.position;

            if (totalResults < position) {
                position = totalResults;
            }

            return position;
        }
    });
});
/* static_content/default/default/scripts/exp/flights/searchResults/PriceTrendsModal.js */
/*jslint browser: true, for: true, multivar: true, single: true, this: true, white: true */
/*global define, require, window */

define('priceTrendsModal', ['jquery', 'flights', 'i18n', 'uitk', 'analytics', 'dctk/dctk', 'handlebars', 'configuration', 'experiments', 'priceTrendsChart', 'priceAlert', 'sitebrand'], function ($, Flights, i18n, uitk, analytics, dctk, handlebars, configuration, experiments, priceTrendsChart, priceAlert, sitebrand) {
    'use strict';

    var priceTrendsModal = {
        mainConfig: {
            daysDelta: 13,
            priceTrendDelta: 10,
            priceTrendRise: 'rise',
            priceTrendFall: 'fall',
            priceTrendUnchanged: 'unchanged',
            priceFormatPattern: '$#',
            dateFormatPattern: 'MMM d',
            thousandSeparator: ',',
            millisBeforeCreatePriceAlertLoader: 5
        },
        createPriceAlertLoaderTimer: null,
        submitted: '',
        graphRendered: false,
        $el: undefined,

        render: function (config) {
            var self = this,
                userType = $.parseJSON($('#omnitureJSON').text()).omnitureProperties.userType,
                userState = 'unidentified';

            if (self.$el !== undefined) {
                self.$el.remove();
            }

            if (config.afterElement.length === 0) {
                return;
            }

            if (userType === 'AUTHENTICATED') {
                userState = 'authenticated';
            } else if (userType === 'IDENTIFIED') {
                userState = 'identified';
            }

            self.$el = $(handlebars.templates.priceTrends({
                modalTitle: i18n.priceTrendsModal.priceTrendInsufficientDataModalTitle,
                continuousShoppingPriceAlertVariant: configuration.priceAlerts.variant,
                sitebrandname: sitebrand.brandname,
                userState: userState
            }));

            config.afterElement.after(self.$el);

            if (!this.graphRendered) {
                if (this.validateConfig(config)) {
                    priceTrendsChart.renderGraph({
                        config: config,
                        mainConfig: self.mainConfig,
                        complete: function () {
                            uitk.subscribe('modal.appended', self, self.onModalOpen);
                            uitk.subscribe('modal.close', self, self.onModalClose);
                            self.graphRendered = true;
                        }
                    });
                } else {
                    this.logMessage('The provided configuration is invalid. Can not render price trends.');
                }
            }
        },

        onModalOpen: function (topic, modal) {
            if (modal.options.modalId === 'priceTrendsGraphModal') {
                $('.price-trends-graph-get-price-alerts-button').removeAttr('disabled');

                if (priceTrendsChart.data && priceTrendsChart.data.chartData) {
                    $('#graph-container-patern').removeClass('hidden');
                    this.getModalTitle(priceTrendsChart.data.chartData);
                    priceTrendsChart.setContentToAppend($('#graph-container-patern'));
                    priceTrendsChart.setIconTrend($('#icon-price-trend'));
                    priceTrendsChart.logNumberOfValidDataPoints(modal);

                    if (priceAlert.isSubscribedToPriceAlerts) {
                        $('#not-subscribed-description-text').remove();
                    }

                    this.setDescription($('#description-price-trends-full').text());

                    // set aria-describedby on the generated svg element to parent div with correct accessibility text
                    $("#price-trends-graph-description-chart svg").attr( "aria-describedby", "price-trends-graph-description-chart");
                } else {
                    $('#graph-container-patern').addClass('hidden');
                    this.logMessage('Failed to get response from Price Trends service.');
                }

                if (priceAlert.isSubscribedToPriceAlerts) {
                    this.hideForm();
                }
            }
        },

        validateConfig: function (config) {
            return config.afterElement;
        },

        showPriceTrendsModal: function () {
            $('.price-trends-graph-modal-link').click();
        },

        getPriceAlerts: function (target, event, context) {
            var continuousShoppingPriceAlertVariant = configuration.priceAlerts.variant,
                emailAddress,
                self = context;

            if (continuousShoppingPriceAlertVariant === 3) {
                if (self.validateEmailInputField()) {
                    emailAddress = $('.price-trends-graph-email-input-field').val();
                    self.createPriceAlerts(emailAddress);
                } else {
                    uitk.utils.focusElement($('#priceTrendsGraphEmailValidationError'));
                }
            } else if (continuousShoppingPriceAlertVariant === 1) {
                self.scratchpadSubscribe();
            }
            if (event && event.preventDefault) {
                event.preventDefault();
            }
        },
        getModalTitle: function (chartData) {
            if (chartData) {
                $('#priceTrendsGraphModal-title').text(i18n.priceTrendsModal.priceTrendOverThePastTwoWeekModalTitle);
            } else {
                $('#priceTrendsGraphModal-title').text(i18n.priceTrendsModal.priceTrendInsufficientDataModalTitle);
            }
        },

        onModalClose: function (topic, modal) {
            var continuousShoppingPriceAlertVariant = configuration.priceAlerts.variant,
                email;
            if (modal.options.modalId === 'priceTrendsGraphModal' && !this.submitted && continuousShoppingPriceAlertVariant === 3) {
                email = $('.price-trends-graph-email-input-field').val();
                this.clearValidation();
                if (email) {
                    analytics.trackAction('FLT.SR.SeePriceTrends.Close.Aborted', modal);
                } else {
                    analytics.trackAction('FLT.SR.SeePriceTrends.Close.Ignored', modal);
                }
                uitk.utils.focusElement($('#seePriceTrendsGraphButton'));
            }
        },
        showAddedToPriceAlertsNotification: function () {
            priceAlert.showAddedToPriceAlertsNotification();
            uitk.utils.liveAnnounce(i18n.priceTrendsModal.priceTrendsAddedToPriceAlerts);
        },

        showCheckYourEmailNotification: function () {
            uitk.utils.liveAnnounce(i18n.priceTrendsModal.priceTrendsCheckYourEmail);
            priceAlert.showCheckYourEmailNotification();
            uitk.utils.focusElement($('#priceChangeAlertCheckYourEmail'));
        },

        showGetPriceAlertsLoading: function () {
            this.createPriceAlertLoaderTimer = null;
            $('.price-trends-graph-get-price-alerts-button').addClass('hidden');
            $('#priceTrendsGraphTermsAndPrivacyFooter').addClass('hidden');
            $('#priceTrendsGraphGetPriceAlertsError').addClass('hidden');
            $('#priceTrendsGraphGetPriceAlertsLoading').removeClass('hidden');
            uitk.utils.liveAnnounce(i18n.priceTrendsModal.priceTrendsCreatingYourPriceAlert);
        },

        showGetPriceAlertsError: function () {
            $('.price-trends-graph-get-price-alerts-button').addClass('hidden');
            $('#priceTrendsGraphTermsAndPrivacyFooter').addClass('hidden');
            $('#priceTrendsGraphGetPriceAlertsError').removeClass('hidden');
            $('#priceTrendsGraphGetPriceAlertsLoading').addClass('hidden');
            uitk.utils.liveAnnounce(i18n.priceTrendsModal.priceTrendsCreatingYourPriceAlertError);
        },

        hideForm: function () {
            $('#priceTrendsModuleGraphForm').addClass('hidden');
        },

        clearValidation: function () {
            $('#priceTrendsGraphEmailValidationError').addClass('visuallyhidden');
            $('.price-trends-graph-email-label').removeClass('invalid');
        },

        resetFormToDefault: function () {
            var continuousShoppingPriceAlertVariant = configuration.priceAlerts.variant,
                emailInputField;

            $('#priceTrendsGraphGetPriceAlertsError').addClass('hidden');
            $('#priceTrendsGraphGetPriceAlertsLoading').addClass('hidden');
            if (continuousShoppingPriceAlertVariant > 2) {
                emailInputField = $('.price-trends-graph-email-input-field');
                emailInputField.val('');
                emailInputField.removeClass('hidden');
            }
            if (continuousShoppingPriceAlertVariant !== 2) {
                $('.price-trends-graph-get-price-alerts-button').removeClass('hidden');
                $('#priceTrendsGraphTermsAndPrivacyFooter').removeClass('hidden');
            }
        },

        resetForm: function () {
            if (this.submitted === 'succ') {
                this.hideForm();
            } else if (this.submitted === 'fail') {
                this.submitted = '';
                this.resetFormToDefault();
            }
        },

        scratchpadSubscribe: function () {
            var self = this;

            if (!this.createPriceAlertLoaderTimer) {
                this.logGetPriceAlerts();
                this.setTimeoutForLoader();
                priceAlert.subscribeViaScratchpad({
                    success: function () {
                        self.showAddedToPriceAlertsNotification();
                        self.closeModal();
                    },
                    error: function () {
                        self.logMessage('Failed to subscribe to send me notes via Scratchpad!');
                        self.showServerErrorMessage();
                    }
                });
            }
        },
        logMessage: function (message) {
            console.log(message);
            if (dctk && dctk.logging && dctk.logging.logMessage) {
                dctk.logging.logMessage(message);
            }
        },
        createPriceAlerts: function (emailAddress) {
            var self = this;

            if (!this.createPriceAlertLoaderTimer) {
                $('.price-trends-graph-get-price-alerts-button').attr('disabled', 'disabled');
                this.logGetPriceAlerts();
                this.setTimeoutForLoader();
                priceAlert.createPriceAlerts(emailAddress, {
                    channelType: 'FSRPriceTrendsPriceAlerts',
                    redirectUrlReferrer: 'EML.FLT.SR.SeePriceTrends.GetPriceAlerts',
                    success: function (data) {
                        self.setUpOmnitureDataForSoftAccountCreation(data);
                        if (data.validationStatus === 'NOT_VALIDATED' || data.validationStatus === 'PENDING_VALIDATION') {
                            self.closeModal();
                            self.showCheckYourEmailNotification();
                            experiments.execute('PRICEALERTS.CHECKEMAILCONFIRM.MODAL', {});
                        } else if (data.validationStatus === 'VALIDATED') {
                            self.closeModal();
                            self.showAddedToPriceAlertsNotification();
                        } else {
                            self.logMessage('Failed to create price alerts!');
                            self.showServerErrorMessage();
                        }
                    },
                    error: function () {
                        self.logMessage('Failed to create price alerts!');
                        self.showServerErrorMessage();
                    }
                });
            }
        },

        setTimeoutForLoader: function () {
            this.createPriceAlertLoaderTimer = setTimeout(this.showGetPriceAlertsLoading, this.mainConfig.millisBeforeCreatePriceAlertLoader);
        },

        resetTimeoutForLoader: function () {
            if (this.createPriceAlertLoaderTimer) {
                clearTimeout(this.createPriceAlertLoaderTimer);
                this.createPriceAlertLoaderTimer = null;
            }
        },

        setUpOmnitureDataForSoftAccountCreation: function (data) {
            if (data.newSoftAccountCreated !== undefined && data.newSoftAccountCreated === true) {
                if (dctk !== undefined) {
                    dctk.onReady(function () {
                        dctk.trackEvent('o', 'PriceTrendsGraph', {eVar28: 'SOFT.ACCOUNT.CREATED', prop16: 'SOFT.ACCOUNT.CREATED'});
                    });
                }
            }
        },

        logGetPriceAlerts: function () {
            analytics.trackAction('FLT.SR.SeePriceTrends.GetPriceAlerts', $('.price-trends-graph-get-price-alerts-button'));
        },

        validateField: function ($elem) {
            var $label = $elem.parent('label'),
                $error = $('#' + $elem.attr('aria-describedby')),
                errorMsg,
                emailReg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

            if (!emailReg.test($elem.val())) {
                $label.addClass('invalid');
                $elem.attr('aria-invalid', 'true');
                errorMsg = $elem.data('validationMsg');
                $error.html(errorMsg).removeClass('visuallyhidden');
                return false;
            }

            $label.removeClass('invalid');
            $elem.attr('aria-invalid', 'false');
            $error.html('').addClass('visuallyhidden');

            return true;
        },

        validateEmailInputField: function () {
            return this.validateField($('.price-trends-graph-email-input-field'));
        },

        setDescription: function (description) {
            $('#price-trends-graph-description-chart').attr('aria-label', description);
        },

        showServerErrorMessage: function () {
            this.submitted = 'fail';
            this.resetTimeoutForLoader();
            this.showGetPriceAlertsError();
        },

        closeModal: function () {
            this.submitted = 'succ';
            this.resetTimeoutForLoader();
            this.resetForm();
            uitk.modal.close();
        }
    };

    return priceTrendsModal;
});

/* static_content/default/default/scripts/exp/flights/searchResults/scratchpadModalPriceAlerts.js */
define('scratchpadModalPriceAlerts', ['jquery', 'i18n', 'uitk', 'analytics', 'dctk/dctk', 'configuration', 'experiments', 'priceAlert', 'fluxClickHandler'], function ($, i18n, uitk, analytics, dctk, configuration, experiments, priceAlert, fluxClickHandler) {
    'use strict';

    var scratchpadModalPriceAlerts = {
        createPriceAlertLoaderTimer: null,
        submitted: '',
        optInEndpoint: '/scratchpadoptin',
        subscribed: false,
        parentView: null,
        initialize: function (options) {
            this.bindEvents(options.priceAlertVariant);
            this.parentView = options.parentView;
            this.subscribeToModal();
        },

        bindEvents: function (priceAlertVariant) {
            if (priceAlertVariant === 1) {
                fluxClickHandler.addHandler('createPriceAlertScratchpadModal', this.scratchpadSubscribe, this);
            } else if (priceAlertVariant >= 0) {
                fluxClickHandler.addHandler('createPriceAlertScratchpadModal', this.createPriceAlertsActionButton, this);
            }
        },

        onModalOpen: function (topic, modal) {
            if (modal.options.modalId === 'scratchpadOptin') {
                $('#scratchpadOptin.modal-wrap').addClass('force-center-aligned');
                $('.send-me-notes-email-input-field').blur(this, this.updateForm);
            }
        },

        onModalClose: function (topic, modal) {
            if (modal.options.modalId === 'scratchpadOptin' && !this.submitted) {
                if (this.isEmailEmpty()) {
                    analytics.trackAction('FLT.SR.ScratchpadModal.PriceAlerts.Close.Ignored', modal);
                } else {
                    analytics.trackAction('FLT.SR.ScratchpadModal.PriceAlerts.Close.Aborted', modal);
                }
            }
        },

        updateForm: function (topic) {
            var self = topic.data,
                alertMessage = i18n.sendSearchesFromSPModal.sendSearchesFromSPModalPleaseEnterValidEmailText;

            if (self.isEmailValid()) {
                self.removeValidationError();
            } else {
                if (self.isEmailEmpty()) {
                    alertMessage = i18n.sendSearchesFromSPModal.sendSearchesFromSPModalPleaseCompleteAllFieldsText;
                }
                self.updateAlertMessage(alertMessage, self);
            }
        },

        updateAlertMessage: function (message, self) {
            $('#sendMeNotesValidationAlert').find('.alert-title').text(message);
            self.addValidationError();
        },

        addValidationError: function () {
            var label = $('.send-me-notes-email-input-field').parent('label');

            label.addClass('invalid');
            $('.send-me-notes-email-input-field').attr('aria-invalid', 'true');
            $('#sendMeNotesValidationAlert').removeClass('hidden');
        },

        removeValidationError: function () {
            var label = $('.send-me-notes-email-input-field').parent('label');
            label.removeClass('invalid');
            $('.send-me-notes-email-input-field').attr('aria-invalid', 'false');
            $('#sendMeNotesValidationAlert').addClass('hidden');
        },

        isEmailEmpty: function () {
            return $('.send-me-notes-email-input-field').val() === '';
        },

        isEmailValid: function () {
            var result = false,
                emailReg = /^([A-Za-z0-9_\-\.])+@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            if (emailReg.test($('.send-me-notes-email-input-field').val())) {
                result = true;
            }
            return result;
        },

        subscribeToModal: function () {
            if (!this.subscribed) {
                uitk.subscribe('modal.appended', this, this.onModalOpen);
                uitk.subscribe('modal.close', this, this.onModalClose);
                this.subscribed = true;
            }
        },

        logGetPriceAlerts: function () {
            analytics.trackAction('FLT.SR.ScratchpadModal.PriceAlerts.SendMeSearches', $('#send-me-notes-button'));
        },

        setTimeoutForLoader: function () {
            this.createPriceAlertLoaderTimer = setTimeout(this.showGetPriceAlertsLoading(), configuration.priceAlerts.loaderTimeout);
        },

        showGetPriceAlertsLoading: function () {
            this.createPriceAlertLoaderTimer = null;
            $('#sendMeNotesValidationAlert').addClass('hidden');
            $('fieldset.sendMeMySearches').addClass('hidden');
            $('#send-me-notes-button').addClass('hidden');
            $('#send-me-notes-price-alerts-loading').removeClass('hidden');
            $('a.modal-close.click-handler-range').addClass('hidden');
            uitk.utils.liveAnnounce(i18n.sendSearchesFromSPModal.sendSearchesFromSPModalCreatingYourPriceAlert);
        },

        showGetPriceAlertsError: function (self) {
            $('#sendMeNotesValidationAlert').removeClass('hidden');
            $('fieldset.sendMeMySearches').removeClass('hidden');
            $('#send-me-notes-button').removeClass('hidden');
            $('#send-me-notes-price-alerts-loading').addClass('hidden');
            $('a.modal-close.click-handler-range').removeClass('hidden');
            self.updateAlertMessage(i18n.sendSearchesFromSPModal.sendSearchesFromSPModalErrorInSending, self);
            uitk.utils.liveAnnounce(i18n.sendSearchesFromSPModal.sendSearchesFromSPModalCreatingYourPriceAlertError);
        },

        getUrlParameter: function (paramName) {
            var searchString = $(window)[0].location.search.substring(1),
                i,
                val,
                params = searchString.split('&');
            for (i = 0; i < params.length; i++) {
                val = params[i].split('=');
                if (val[0] === paramName) {
                    return val[1];
                }
            }
            return '';
        },

        resetTimeoutForLoader: function (self) {
            if (self.createPriceAlertLoaderTimer) {
                clearTimeout(self.createPriceAlertLoaderTimer);
                self.createPriceAlertLoaderTimer = null;
            }
        },

        setUpOmnitureDataForSoftAccountCreation: function (data) {
            if (data.newSoftAccountCreated !== undefined && data.newSoftAccountCreated === true) {
                if (typeof dctk !== 'undefined') {
                    dctk.onReady(function () {
                        dctk.trackEvent('o', 'sendSearchesFromSPModal', {eVar28: 'SOFT.ACCOUNT.CREATED', prop16: 'SOFT.ACCOUNT.CREATED'});
                    });
                }
            }
        },

        logMessage: function (message) {
            console.log(message);
            if (dctk && dctk.logging && dctk.logging.logMessage) {
                dctk.logging.logMessage(message);
            }
        },

        createPriceAlerts: function (self) {
            var emailAddress = $('.send-me-notes-email-input-field').val();

            if (!self.createPriceAlertLoaderTimer) {
                this.logGetPriceAlerts();
                this.setTimeoutForLoader();
                priceAlert.createPriceAlerts(emailAddress, {
                    channelType: 'FSRScratchpadModalPriceAlerts',
                    redirectUrlReferrer: 'EML.FLT.SR.ScratchpadModal',
                    success: function (data) {
                        self.parentView.onUpdateOptinStatus(true, true);
                        self.setUpOmnitureDataForSoftAccountCreation(data);
                        if (data.validationStatus === 'NOT_VALIDATED' || data.validationStatus === 'PENDING_VALIDATION') {
                            self.closeModal(self);
                            priceAlert.showCheckYourEmailNotification();
                            experiments.execute('PRICEALERTS.CHECKEMAILCONFIRM.MODAL', {});
                            uitk.utils.liveAnnounce(i18n.priceTrendsModal.priceTrendsCheckYourEmail);
                        } else if (data.validationStatus === 'VALIDATED') {
                            self.closeModal(self);
                            priceAlert.showAddedToPriceAlertsNotification();
                            uitk.utils.liveAnnounce(i18n.priceTrendsModal.priceTrendsAddedToPriceAlerts);
                        } else {
                            self.showServerErrorMessages(self);
                        }
                    },
                    error: function () {
                        self.showServerErrorMessages(self);
                    }
                });
            }
        },

        closeModal: function (self) {
            self.submitted = 'succ';
            self.resetTimeoutForLoader(self);
            priceAlert.isSubscribedToPriceAlerts = true;
            uitk.modal.close();
        },

        showServerErrorMessages: function (self) {
            self.logMessage('Failed to create price alerts!');
            self.submitted = 'fail';
            self.resetTimeoutForLoader(self);
            self.showGetPriceAlertsError(self);
        },

        createPriceAlertsActionButton: function (target, event, context) {
            var self = context,
                request;

            if (configuration.scratchpadModal.sendSearches) {
                self.updateForm({
                    data: self
                });

                if (!self.isEmailEmpty() && self.isEmailValid()) {
                    self.createPriceAlerts(self);
                }
            } else {
                request = $.ajax({
                    url: self.optInEndpoint,
                    type: 'POST',
                    data: {
                        sendMeNotes: true
                    }
                });

                request.done(function (loggedIn) {
                    if (loggedIn) {
                        self.parentView.onUpdateOptinStatus(true, true);
                    } else {
                        window.location.href = configuration.scratchpadModal.redirectUrl;
                    }
                });

                request.fail(function () {
                    self.parentView.onUpdateOptinStatus(true, false);
                });
            }

            event.preventDefault();
        },

        scratchpadSubscribe: function (target, event, context) {
            var self = context;

            if (!self.createPriceAlertLoaderTimer) {
                self.logGetPriceAlerts();
                self.setTimeoutForLoader(self);
                priceAlert.subscribeViaScratchpad({
                    success: function () {
                        priceAlert.showAddedToPriceAlertsNotification();
                        self.parentView.onUpdateOptinStatus(true, true);
                        self.closeModal(self);
                    },
                    error: function () {
                        self.logMessage('Failed to subscribe to send me notes via Scratchpad!');
                        self.showServerErrorMessages();
                    }
                });
            }
        }
    };

    return scratchpadModalPriceAlerts;
});


/* static_content/default/default/scripts/exp/flights/flux/liveAnnounceDispatcher.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define */

define('liveAnnounceDispatcher', ['flights', 'jquery', 'uitk', 'i18n','configuration'], function(flights, $, uitk, i18n, configuration){

    'use strict';

    var liveAnnounceDispatcher,
        helpers,
        router;

    helpers = {
        getCurrentLeg: function () {
            return router === undefined  ? 0 : router.getNextLegToView();
        }
    };

    liveAnnounceDispatcher = {
        initialize: function() {
            this.setRouter();
            this.setListeners();
        },

        setRouter: function(){
            if (router === undefined && configuration.view.isByot) {
                require(['setupRouter'], function (setupRouter) {
                    router = setupRouter()
                });
            } else if(!configuration.view.isByot){
                router = undefined;
            }
        },

        setListeners: function(){
            flights.vent.on('uiModel.resultsFetchSuccess.InitialSearch', function(){
                var selectedSortText = $('#sortBar').find('select option:selected').text();

                if(!configuration.view.isByot){
                    return;
                }

                if(helpers.getCurrentLeg() === 0){
                    uitk.utils.liveAnnounce(i18n.sorting.accessibility.announceDeparturePage.replace('{0}', selectedSortText), 'polite');
                } else {
                    uitk.utils.liveAnnounce(i18n.sorting.accessibility.announceReturnPage.replace('{0}', selectedSortText), 'polite');
                }
            });

            flights.vent.on('uiModel.resultsFetchSuccess.LegUnselect', function(){
                var selectedSortText = $('#sortBar').find('select option:selected').text();
                uitk.utils.liveAnnounce(i18n.sorting.accessibility.announceDeparturePage.replace('{0}', selectedSortText), 'polite');
            });

            flights.vent.on('uiModel.resultsFetchSuccess.LegSelect', function(){
                var selectedSortText = $('#sortBar').find('select option:selected').text();
                uitk.utils.liveAnnounce(i18n.sorting.accessibility.announceReturnPage.replace('{0}', selectedSortText), 'polite');
            });
        }
    };

    return liveAnnounceDispatcher;
});
/* static_content/default/default/scripts/exp/flights/flux/views/WizardView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('wizardView', ['jquery', 'underscore', 'backbone', 'handlebars', 'analytics', 'uitk', 'i18n', 'wizardUrlBuilder', 'wizardModelValidator', 'flights', 'experiments', 'configuration'],
    function ($, _, Backbone, handlebars, analytics, uitk, i18n, WizardUrlBuilder, WizardModelValidator, flights, experiments, configuration) {
        'use strict';

        var helpers = {
            getTripNumber: function ($target) {
                return $target.parents('.trip-info').data('trip-number');
            },
            onMoreTripsToggleOpen: function ($target) {
                analytics.trackAction('FLT.SR.Wizard.AddMoreTrips', $target[0]);
                uitk.utils.focusElement($('#departure-airport-3'));
            },
            onMoreTripsToggleClose: function ($target) {
                analytics.trackAction('FLT.SR.Wizard.HideTrips', $target[0]);
            },
            onNearbyAirportsLinkClick: function (event) {
                var $target = $(event.target),
                    nearbyType = $target.data('nearbytype'),
                    omnitureString = 'FLT.SR.Wizard.Trip' + helpers.getTripNumber($target) + '.NearbyAirports';

                if (nearbyType === 'depart') {
                    omnitureString += '.DepartureAirport';
                }
                else {
                    omnitureString += '.ArrivalAirport';
                }

                omnitureString += '.Clicked';

                analytics.trackAction(omnitureString, event.target);
            },
            onNearbyAirportContentClick: function (event) {
                var $target = $(event.target),
                    tripNumber = helpers.getTripNumber($target),
                    airportValue = $target.data('airportname') + ' (' + $target.data('airportcode') + ')',
                    nearbyType = $target.data('nearbytype'),
                    $airportInput,
                    omnitureString = 'FLT.SR.Wizard.Trip' + tripNumber + '.NearbyAirports';

                if (nearbyType === 'depart') {
                    omnitureString += '.DepartureAirport';
                    $airportInput = $('#departure-airport-' + tripNumber);
                }
                else {
                    omnitureString += '.ArrivalAirport';
                    $airportInput = $('#arrival-airport-' + tripNumber);
                }

                omnitureString += '.Contents.Selected';

                analytics.trackAction(omnitureString, event.target);
                $airportInput.val(airportValue);
                this.triggerAirportFieldChange($airportInput);
            },
            onDepartureAirportChange: function (event) {
                var $target = $(event.target),
                    tripNumber = helpers.getTripNumber($target),
                    tripModel = this.model.get('trips').at(tripNumber - 1),
                    omnitureString = 'FLT.SR.Wizard.Trip' + tripNumber + '.DepartureAirport.Changed';

                analytics.trackAction(omnitureString, event.target);
                tripModel.get('departure').set('airport', $target.val());

                if(this.airportsDropDown.enabled) {
                    tripModel.get('arrival').set('airport', '');
                }
            },
            onArrivalAirportChange: function (event) {
                var $target = $(event.target),
                    tripNumber = helpers.getTripNumber($target),
                    tripModel = this.model.get('trips').at(tripNumber - 1),
                    omnitureString = 'FLT.SR.Wizard.Trip' + tripNumber + '.ArrivalAirport.Changed';

                analytics.trackAction(omnitureString, event.target);
                tripModel.get('arrival').set('airport', $target.val());
            },
            onDepartureDateChange: function (event) {
                helpers.onDepartureDateSelectDate($(event.target), this.model);
            },
            onReturnDateChange: function (event) {
                helpers.onReturnDateSelectDate($(event.target), this.model);
            },
            onPreferredAirlineChange: function (event) {
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.PreferredAirline';

                analytics.trackAction(omnitureString, event.target);
                this.model.get('travelerPreferences').set('preferredAirline', $target.val());
            },
            onSeatingClassChange: function (event){
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.SeatingClass';

                analytics.trackAction(omnitureString, event.target);
                this.model.get('travelerPreferences').set('seatingClass', $target.val());
            },
            onNonstopFlightChange: function (event){
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.NonStopOnly';

                analytics.trackAction(omnitureString, event.target);
                this.model.get('travelerPreferences').set('nonstopOnly', $target[0].checked);
            },
            onRefundableChange:function (event) {
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.RefundableOnly';

                analytics.trackAction(omnitureString, event.target);
                this.model.get('travelerPreferences').set('refundableOnly', $target[0].checked);
            },
            onChildAgeRulesClick: function (event) {
                var omnitureString = 'FLT.SR.Wizard.AirlineAgeRules';

                analytics.trackAction(omnitureString, event.target);
            },
            onInfantInLapChange: function (event) {
                var $target = $(event.target),
                    inLapValue = true,
                    omnitureString = 'FLT.SR.Wizard.InfantInLap';

                if($target[0].id === 'infants-in-seat') {
                    inLapValue = false;
                    omnitureString = 'FLT.SR.Wizard.InfantInSeat';
                }

                analytics.trackAction(omnitureString, $target[0]);
                this.model.get('travelerPreferences').set('infantsInLap', inLapValue);
            },
            onAdultCountChange: function (event) {
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.Adults';

                analytics.trackAction(omnitureString, event.target);
                this.model.get('travelerPreferences').set('numberOfAdults' , parseInt($target.val()));
            },
            onChildCountChange: function (event) {
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.Children';

                analytics.trackAction(omnitureString, event.target);
                this.model.get('travelerPreferences').set('numberOfChildren' , parseInt($target.val()));
            },
            onChildAgeChange: function (event) {
                var $target = $(event.target),
                    childNum = parseInt($target[0].id.split('-')[2]),
                    childAge = parseInt($target[0].value),
                    omnitureString = 'FLT.SR.Wizard.ChildrenAge' + childNum;

                analytics.trackAction(omnitureString, event.target);
                this.model.get('travelerPreferences').get('childAges').at(childNum - 1).set('age', childAge);
            },
            onOptionsOpen: function ($toggle) {
                analytics.trackAction('FLT.SR.Wizard.ShowOptions', $toggle[0]);
            },
            onOptionsClosed: function ($toggle) {
                analytics.trackAction('FLT.SR.Wizard.HideOptions', $toggle[0]);
            },
            onDepartureDateSelectDate: function ($target, model) {
                var tripNumber = helpers.getTripNumber($target),
                    tripModel = model.get('trips').at(tripNumber - 1),
                    omnitureString = 'FLT.SR.Wizard.Trip' + tripNumber + '.DepartureDate.Changed',
                    departureDate = $target.val(),
                    returnDate = tripModel.get('arrival').get('date').get('shortFormat');
                analytics.trackAction(omnitureString, $target[0]);

                tripModel.get('departure').get('date').set('shortFormat', departureDate);

                if( model.get('routeType') === 'ROUND_TRIP' &&
                    departureDate != '' &&
                    helpers.isDateAfterPreviousDate(departureDate,returnDate, model.get('locale'))) {
                        tripModel.get('arrival').get('date').set('shortFormat', departureDate);
                }
            },
            isValidDate: function(date) {
                return (date instanceof Date) && !isNaN(date.getTime());
            },
            isDateAfterPreviousDate: function(date, earliestDate, locale) {
                var localeDepartureDate = uitk.utils.createLocalizedDate(date, locale),
                    localeEarliestDate = uitk.utils.createLocalizedDate(earliestDate, locale);

                    if (helpers.isValidDate(localeDepartureDate.date)) {
                        return localeDepartureDate.date.getTime() >= localeEarliestDate.date.getTime();
                    }

                return false;
            },
            onReturnDateSelectDate: function ($target, model) {
                var tripNumber = helpers.getTripNumber($target),
                    tripModel = model.get('trips').at(tripNumber - 1),
                    omnitureString = 'FLT.SR.Wizard.Trip' + tripNumber + '.ReturnDate.Changed',
                    returnDate = $target.val();

                if($target.val() === '') {
                    returnDate = tripModel.get('departure').get('date').get('shortFormat');
                }

                analytics.trackAction(omnitureString, $target[0]);
                tripModel.get('arrival').get('date').set('shortFormat', returnDate);
            },
            onOnewaySelect: function (event) {
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.RouteType.Oneway';

                    if (experiments.getVariant(10149) > 0) {
                        omnitureString = 'FLT.SR.Wizard.Toggle.Oneway';
                    }

                analytics.trackAction(omnitureString, event.target);

                this.model.set('routeType', $target.val());
            },
            onMultiDestSelect: function (event) {
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.RouteType.MultiDest';

                    if (experiments.getVariant(10149) > 0) {
                        omnitureString = 'FLT.SR.Wizard.Toggle.MultiDest';
                    }
                    
                analytics.trackAction(omnitureString, event.target);
                this.model.set('routeType', $target.val());
            },
            onRoundtripSelect: function (event) {
                var $target = $(event.target),
                    omnitureString = 'FLT.SR.Wizard.RouteType.Roundtrip',
                    tempReturnDate =this.model.get('trips').at(0).get('departure').get('date').get('shortFormat');

                    if (experiments.getVariant(10149) > 0) {
                        omnitureString = 'FLT.SR.Wizard.Toggle.Roundtrip';
                    }

                analytics.trackAction(omnitureString, event.target);

                if(this.model.get('trips').at(0).get('arrival').get('date').get('shortFormat') === '') {
                    this.model.get('trips').at(0).get('arrival').get('date').set('shortFormat', tempReturnDate);
                }
                this.model.set('routeType', $target.val());
            },

            onSearch: function (event) {
                var url,
                    parameters;

                helpers.clearErrors(this.$el);
                this.model.validate();

                if (this.model.isValid()) {
                    uitk.utils.liveAnnounce(i18n.globalWizard.accessibility.searching, 'polite');
                    analytics.trackAction('FLT.SR.Wizard', event.target);
                    url = WizardUrlBuilder.generateUrl(this.model);
                    populateCacheWithAsyncSearch(url);
                    parameters = WizardUrlBuilder.buildSearchParameters(this.model);
                    flights.vent.trigger('wizardView.beforeSearchIsSent', parameters);

                    this.publishUrl(url);
                }
            },

            clearErrors: function ($el) {
                $el.find('#wizard-error-container').empty();

                $($el.find('.invalid [aria-invalid=true]')).attr('aria-invalid','false');
                $el.find('.invalid').removeClass('invalid');
            },
            invalidateControl: function (target) {
                var invalidClass = 'invalid',
                    $target = $(target);

                $target.attr('aria-invalid', 'true');
                $target.parent().addClass(invalidClass);

                return $target;
            },
            invalidateControlsOnError: function ($el, routeType, error) {
                switch (error.type) {
                    case WizardModelValidator.errorTypes[routeType].DEPARTURE_AIRPORT_BLANK:
                        helpers.invalidateControl($el.find('#departure-airport-' + error.tripNumber));
                        break;
                    case WizardModelValidator.errorTypes[routeType].ARRIVAL_AIRPORT_BLANK:
                        helpers.invalidateControl($el.find('#arrival-airport-' + error.tripNumber));
                        break;
                    case WizardModelValidator.errorTypes[routeType].DEPARTURE_ARRIVAL_AIRPORT_SAME:
                        helpers.invalidateControl($el.find('#arrival-airport-' + error.tripNumber));
                        break;
                    case WizardModelValidator.errorTypes[routeType].INVALID_DEPARTURE_DATE:
                    case WizardModelValidator.errorTypes[routeType].DEPARTURE_DATE_NOT_IN_RANGE:
                    case WizardModelValidator.errorTypes[routeType].DEPARTURE_DATE_PRIOR_TO_PREVIOUS_TRIP:
                        helpers.invalidateControl($el.find('#departure-date-' + error.tripNumber));
                        break;
                    case WizardModelValidator.errorTypes[routeType].INVALID_RETURN_DATE:
                    case WizardModelValidator.errorTypes[routeType].RETURN_DATE_NOT_IN_RANGE:
                        helpers.invalidateControl($el.find('#return-date-' + error.tripNumber));
                        break;
                    case WizardModelValidator.errorTypes.MISSING_CHILD_AGE:
                        helpers.invalidateControl($el.find('#child-age-' + error.childNumber));
                        break;
                    case WizardModelValidator.errorTypes.UNATTENDED_INFANT_IN_LAP:
                    case WizardModelValidator.errorTypes.INVALID_TRAVELER_COUNT:
                        helpers.invalidateControl($el.find('#adult-count'));
                        helpers.invalidateControl($el.find('#child-count'));

                        $el.find('select[id^="child-age-"]').each(function(index, element) {
                            helpers.invalidateControl(element);
                        });

                        break;
                    default:
                        break;
                }
            },
            markControlsAsErrors: function ($el, routeType, errors) {
                _.each(errors, function (error) {
                    helpers.fireOmnitureForError(error.type);
                    helpers.invalidateControlsOnError($el, routeType, error);
                });
            },
            filterDuplicateMissingChildAgeErrors: function (routeType, errors) {
                var errorsWithoutMissingChildAge,
                    firstMissingChildAgeError;

                errorsWithoutMissingChildAge = _.filter(errors, function (error) {
                    return error.type !== WizardModelValidator.errorTypes.MISSING_CHILD_AGE;
                });

                firstMissingChildAgeError = _.find(errors, function (error) {
                    return error.type === WizardModelValidator.errorTypes.MISSING_CHILD_AGE;
                });

                return (firstMissingChildAgeError === undefined) ? errors :
                    _.union(errorsWithoutMissingChildAge, [ firstMissingChildAgeError ]);
            },
            filterDuplicateErrors: function (routeType, errors) {
                return helpers.filterDuplicateMissingChildAgeErrors(routeType, errors);
            },
            showAllErrorElements: function($el) {
                var $moreTripsToggle = $el.find('#more-trips-pane-toggle'),
                    $advancedOptionsToggle = $el.find('#flights-advanced-options-toggle'),
                    moreTripsCollapsed = $moreTripsToggle.attr('aria-expanded') === 'false',
                    advancedOptionsCollapsed = $advancedOptionsToggle.attr('aria-expanded') === 'false',
                    errorElementsSelector, $errorElements,
                    hasTripElementsWithinToggle, hasAdvancedOptionsElementsWithinToggle,

                errorElementsSelector = $el.find('#validation-alert a').map(function () {
                    return '#' + this.href.split('#')[1];
                }).toArray().join(', ');
                $errorElements = $(errorElementsSelector),

                hasTripElementsWithinToggle = $errorElements.parents('#more-trips-pane-content').length > 0,
                hasAdvancedOptionsElementsWithinToggle = $errorElements.parents('#flights-advanced-options-pane').length > 0;

                if(moreTripsCollapsed && hasTripElementsWithinToggle) {
                    $moreTripsToggle.uitk_toggle('open');
                }

                if(advancedOptionsCollapsed && hasAdvancedOptionsElementsWithinToggle) {
                    $advancedOptionsToggle.uitk_toggle('open');
                }
            },
            onErrorLinkClick: function (event) {
                var $link = $(event.target),
                    $target = this.$el.find($link.attr('href'));
                event.preventDefault();
                uitk.utils.focusElement($target);
                return false;
            },
            onTypeaheadResultSelected: function($target, model) {
                var tooltipId,
                    tripType,
                    tripNumber,
                    airportName,
                    tripModel,
                    omnitureString,
                    useUniversalTypeahead = experiments.getVariant(12550) > 0;

                if (useUniversalTypeahead) {
                    tripType = $target.context.attr('id').split('-')[0];
                    tripNumber = helpers.getTripNumber($target.context);
                    airportName = $target.context.val();
                } else {
                    tooltipId = $target.parents('ul').attr('id').replace('-tooltip', '');
                    tripType = tooltipId.split('-')[0];
                    tripNumber = tooltipId.split('-')[1];
                    airportName = $target.text().trim();
                }

                tripModel = model.get('trips').at(tripNumber - 1);
                omnitureString = 'FLT.SR.Wizard.Trip' + tripNumber;

                if ('departure' === tripType) {
                    omnitureString += '.DepartureAirport.Typeahead';
                } else {
                    omnitureString += '.ArrivalAirport.Typeahead';
                }

                analytics.trackAction(omnitureString, $target[0]);
                tripModel.get(tripType).set('airport', airportName);
            },
            createAirportDropDowns: function(trips, airportOptions) {
                require('SearchWizardDropDown', function(DropDown) {
                    _.each(trips, function(trip) {
                        var dropDown = new DropDown(
                            '#departure-airport-' + trip.tripNumber,
                            '#arrival-airport-' + trip.tripNumber,
                            airportOptions,
                            trip.departure.airport,
                            trip.arrival.airport
                        );
                        dropDown.displayDropDown();
                    });
                });
            },
            onSummaryDateClick: function(event) {
                var omnitureString = 'FLT.SR.Responsive.Wizard.ChangeSearch.Date',
                    $toggle = $('#wizard-summary-toggle');
                event.preventDefault();
                analytics.trackAction(omnitureString, event.target);

                $toggle.uitk_toggle('open');
            },
            onSummaryLocationClick: function(event) {
                var omnitureString = 'FLT.SR.Responsive.Wizard.ChangeSearch.Location',
                    $toggle = $('#wizard-summary-toggle');
                event.preventDefault();
                analytics.trackAction(omnitureString, event.target);

                $toggle.uitk_toggle('open');
            },
            onSummaryTravelerClick: function(event) {
                var omnitureString = 'FLT.SR.Responsive.Wizard.ChangeSearch.Traveler',
                    $toggle = $('#wizard-summary-toggle');
                event.preventDefault();
                analytics.trackAction(omnitureString, event.target);

                $toggle.uitk_toggle('open');
            },
            startToggleOpenedClickActions: function() {
                uitk.subscribe('toggle.opened.click', function (topic, data) {
                    if (data.element[0].id === 'more-trips-pane-toggle') {
                        helpers.onMoreTripsToggleOpen(data.element);
                    }

                    if (data.element[0].id === 'flights-advanced-options-toggle') {
                        helpers.onOptionsOpen(data.element);
                    }

                    uitk.unsubscribe('toggle.opened.click');
                });
            },
            subscribeToggleBeforeOpen: function($el) {
                uitk.subscribe('toggle.beforeOpen', function(topic, $toggle, event) {
                    if ($el.find($toggle).length === 0) {
                        return;
                    }

                    helpers.startToggleOpenedClickActions();
                    $toggle.uitk_toggle('open');
                });
            },
            subscribeToggleOpened: function($el) {
                uitk.subscribe('toggle.opened',  function(topic, $toggle) {
                    if ($el.find($toggle).length === 0) {
                        return;
                    }

                    if ($toggle[0].id === 'wizard-summary-toggle') {
                        uitk.utils.focusElement($('#departure-airport-1'));
                    }

                    helpers.completeToggleOpenedClickActions($toggle);
                });
            },
            subscribeToggleClosed: function($el) {
                uitk.subscribe('toggle.closed', function(topic, $toggle) {
                    if ($el.find($toggle).length === 0) {
                        return;
                    }

                    if($toggle[0].id === 'flights-advanced-options-toggle') {
                        helpers.onOptionsClosed($toggle);
                    }

                    if ($toggle[0].id === 'more-trips-pane-toggle') {
                        helpers.onMoreTripsToggleClose($toggle);
                    }
                });
            },
            subscribeDatepickerSelectDate: function($el, model) {
                uitk.subscribe('datepicker.selectDate', function (topic, data) {
                    if ($el.find(data.element).length === 0) {
                        return;
                    }

                    if (data.element[0].id.indexOf('return') >= 0) {
                        helpers.onReturnDateSelectDate(data.element, model);
                        model.set('changeReturnDate' , true);
                    } else {
                        helpers.onDepartureDateSelectDate(data.element, model);
                        model.set('changeDepartDate' , true);
                    }
                });
            },
            subscribeTypeaheadResultSelected: function(model) {
                uitk.subscribe('typeahead.resultSelected', function (topic, data) {
                    if(!data.element.hasClass('close')) {
                        helpers.onTypeaheadResultSelected(data.element, model);
                    }
                });
            },
            completeToggleOpenedClickActions: function($toggle) {
                uitk.publish('toggle.opened.click', {
                    element: $toggle
                });
            },
            fireOmnitureForError: function(errorCode) {
                analytics.trackAction('FLT.SR.Wizard.' + helpers.errorCodes[errorCode], $('#flight-wizard-search-button'));
            },
            errorCodes : {
                  1: 'MissingChildAge',
                  2: 'UnattendedInfantInLap',
                  3: 'InvalidTravelerCount',
                101: 'DepartureAirportBlank',
                102: 'ArrivalAirportBlank',
                103: 'DepartureArrivalAirportSame',
                104: 'InvalidDepartureDate',
                105: 'DepartureDateNotInRange',
                151: 'DepartureDatePriorToPreviousTrip',
                201: 'DepartureAirportBlank',
                202: 'ArrivalAirportBlank',
                203: 'DepartureArrivalAirportSame',
                204: 'InvalidDepartureDate',
                205: 'DepartureDateNotInRange',
                301: 'DepartureAirportBlank',
                302: 'ArrivalAirportBlank',
                303: 'DepartureArrivalAirportSame',
                304: 'InvalidDepartureDate',
                305: 'DepartureDateNotInRange',
                306: 'InvalidReturnDate',
                307: 'ReturnDateNotInRange'
            },
            generateAttributeString: function(attributes) {
                return _.map(attributes, function(value, key) {
                    return key + ':' + value;
                }).join('|');
            }
        };

        return Backbone.View.extend({
            el: '#search-wizard-container',
            templates: {
                wizardContainer: handlebars.templates.WizardContainer,
                wizardMultiDest: handlebars.templates.WizardMultiDest,
                wizardOneway: handlebars.templates.WizardOneway,
                wizardRoundtrip: handlebars.templates.WizardRoundtrip,
                advancedOptionsToggle: handlebars.templates.WizardAdvancedOptionsToggle,
                advancedOptionsContainer: handlebars.templates.WizardAdvancedOptionsContainer,
                wizardErrors: handlebars.templates.WizardErrors
            },
            events: {
                'click button[id^="nearby-airports-link"]': helpers.onNearbyAirportsLinkClick,
                'click a.nearby-airport.link': helpers.onNearbyAirportContentClick,
                'change [id^="departure-airport-"]': helpers.onDepartureAirportChange,
                'change [id^="arrival-airport-"]': helpers.onArrivalAirportChange,
                'change input[id^="departure-date-"]': helpers.onDepartureDateChange,
                'change input[id^="return-date"]': helpers.onReturnDateChange,
                'change select#preferred-airline': helpers.onPreferredAirlineChange,
                'change select#seating-class': helpers.onSeatingClassChange,
                'change input#nonstop-flights': helpers.onNonstopFlightChange,
                'change input#refundable-flights': helpers.onRefundableChange,
                'click a#child-age-rules': helpers.onChildAgeRulesClick,
                'change input#infants-in-lap': helpers.onInfantInLapChange,
                'change input#infants-in-seat': helpers.onInfantInLapChange,
                'change select#adult-count': helpers.onAdultCountChange,
                'change select#child-count' : helpers.onChildCountChange,
                'change select[id^="child-age-"]': helpers.onChildAgeChange,
                'change input#oneway-flight': helpers.onOnewaySelect,
                'change input#multi-dest-flight': helpers.onMultiDestSelect,
                'change input#round-trip-flight': helpers.onRoundtripSelect,
                'click #flight-wizard-search-button' : helpers.onSearch,
                'click #validation-alert a': helpers.onErrorLinkClick,
                'click a#wizard-dates' : helpers.onSummaryDateClick,
                'click a#wizard-locations' : helpers.onSummaryLocationClick,
                'click a#wizard-travelers' : helpers.onSummaryTravelerClick,
                'click .origin .btn.btn-clear' : helpers.onDepartureAirportChange,
                'click .destination .btn.btn-clear' : helpers.onArrivalAirportChange
            },
            initialize: function(options) {
                var self = this;

                experiments.execute('replaceWizardHBS', this);

                self.routeTypeSwitch = options.routeTypeSwitch;
                self.showNearbyAirports = options.showNearbyAirports;
                self.showRefundable = options.showRefundable;
                self.showAdditionalOptions = options.showAdditionalOptions;
                self.showToggleSummaryAdditionalOptions = options.showToggleSummaryAdditionalOptions;
                self.airportsDropDown = options.airportsDropDown;
                self.showNonstop = options.showNonstop;
                self.showPreferredAirlines = options.showPreferredAirlines;
                self.showPreferredCabinClass = options.showPreferredCabinClass;
                self.airportFieldClearButtonEnabled = options.airportFieldClearButtonEnabled;
                self.showWizardForPackages = options.showWizardForPackages;
                self.renderOnInit = options.renderOnInit;

                self.listenTo(self.model, 'change:routeType', self.renderFlightInfo);
                self.listenTo(self.model.get('travelerPreferences'), 'change:numberOfChildren', self.renderOptions);
                self.listenTo(self.model.get('travelerPreferences').get('childAges'), 'change', self.renderOptions);
                self.listenTo(self.model, 'invalid', self.renderErrors);

                helpers.subscribeToggleBeforeOpen(self.$el);
                helpers.subscribeToggleOpened(self.$el);
                helpers.subscribeToggleClosed(self.$el);
                helpers.subscribeDatepickerSelectDate(self.$el, self.model);
                helpers.subscribeTypeaheadResultSelected(self.model);

                if(self.airportsDropDown.enabled) {
                    self.model.updateAirportsWithAirportCode();
                }

                if (self.renderOnInit) {
                    self.render();
                }
            },

            render: function() {
                var routeType = this.model.get('routeType'),
                    trips = this.model.get('trips'),
                    travelerPreferences = this.model.get('travelerPreferences'),
                    departureDate = trips.at(0).get('departure').get('date'),
                    returnDate = trips.getLastTravelDate(routeType),
                    renderContext = {
                        routeType: routeType,
                        containerConfiguration: {
                            routeTypeSwitch: this.routeTypeSwitch,
                            showWizardForFlightCarPackages: this.showWizardForPackages
                        },
                        summaryViewData: {
                            departureCity: trips.at(0).get('departure').get('city'),
                            departureCode: trips.at(0).get('departure').get('code'),
                            fullDepartureDate: departureDate.toFullDateString(),
                            mediumDepartureDate: departureDate.toMediumDateString(),
                            arrivalCity: trips.at(0).get('arrival').get('city'),
                            arrivalCode: trips.at(0).get('arrival').get('code'),
                            fullReturnDate: returnDate.toFullDateString(),
                            mediumReturnDate: returnDate.toMediumDateString(),
                            showReturnDate: (routeType === 'ROUND_TRIP' || (routeType === 'MULTIPLE_DESTINATION' && departureDate !== returnDate)),
                            showEllipses: routeType === 'MULTIPLE_DESTINATION',
                            totalPassengers: travelerPreferences.get('totalPassengers')
                        }
                    },
                    optionsModelJson = JSON.parse(JSON.stringify(travelerPreferences)),
                    advancedOptionsHtml = this.templates.advancedOptionsToggle(
                        $.extend(optionsModelJson, {
                            optionsConfiguration: {
                                showAdditionalOptions: this.showAdditionalOptions,
                                showRefundable: this.showRefundable,
                                showNonstop: this.showNonstop,
                                showPreferredAirlines: this.showPreferredAirlines,
                                showPreferredCabinClass: this.showPreferredCabinClass,
                                showToggleSummaryAdditionalOptions : this.showToggleSummaryAdditionalOptions
                            }
                        })
                    );

                this.$el.html(this.templates.wizardContainer(renderContext));
                this.renderFlightInfo();

                this.$el.find('#advanced-options-container').empty().append(advancedOptionsHtml);
                experiments.execute('FSR_Mobile_PersistentSearchWizard', {});
            },
            renderFlightInfo: function() {
                var typeahead = this.model.get('typeAhead'),
                    airportFieldDataAttributes = helpers.generateAttributeString({
                        'provide': 'typeahead',
                        'version': 'v4',
                        'template': '#uitk-ta-default',
                        'js-theme': 'typeahead',
                        'minchar': typeahead.minChars,
                        'mask': 95,
                        'locale': typeahead.locale,
                        'lob': 'FLIGHTS',
                        'autoselect': 'true'
                    }),
                    airportFieldAttributes = helpers.generateAttributeString({
                        size: 1,
                        autocomplete: 'off'
                    }),
                    $container = this.$el.find('#flight-info-container'),
                    routeType = this.model.get('routeType'),
                    tripsJson = JSON.parse(JSON.stringify(this.model.get('trips'))),
                    routes = {
                        MULTIPLE_DESTINATION: {
                            template: this.templates.wizardMultiDest,
                            className: 'multiple-destination-info'
                        },
                        ONE_WAY: {
                            template: this.templates.wizardOneway,
                            className: 'oneway-info'
                        },
                        ROUND_TRIP: {
                            template: this.templates.wizardRoundtrip,
                            className: 'round-trip-info'
                        }
                    },
                    classesToRemove = _.pluck(routes, 'className'),
                    modelJson = {
                        trips: tripsJson,
                        tripConfiguration: {
                            validSearchDates: this.model.get('validSearchDates'),
                            showPairDatePicker: 'ROUND_TRIP' === this.model.get('routeType'),
                            showNearbyAirports: this.showNearbyAirports,
                            showAirportsDropDown: this.airportsDropDown.enabled,
                            airportFormFieldDataAttributes: airportFieldDataAttributes,
                            airportFormFieldAttributes: airportFieldAttributes,
                            airportFieldClearButtonEnabled: this.airportFieldClearButtonEnabled,
                            typeahead: this.model.get('typeAhead'),
                            useUniversalTypeahead: experiments.getVariant(12550) > 0
                        }
                    };
                $container.empty()
                    .removeClass(classesToRemove.join(' '))
                    .addClass(routes[routeType].className)
                    .append(routes[routeType].template(modelJson));

                if(this.airportsDropDown.enabled) {
                    helpers.createAirportDropDowns(tripsJson, this.airportsDropDown.options);
                }
            },
            renderOptions: function() {
                var optionsModelJson = JSON.parse(JSON.stringify(this.model.get('travelerPreferences'))),
                    advancedOptionsHtml = this.templates.advancedOptionsContainer(
                        $.extend(optionsModelJson, {
                            optionsConfiguration: {
                                showAdditionalOptions: this.showAdditionalOptions,
                                showRefundable: this.showRefundable,
                                showNonstop: this.showNonstop,
                                showPreferredAirlines: this.showPreferredAirlines,
                                showPreferredCabinClass: this.showPreferredCabinClass
                            }
                        })
                    );

                this.$el.find('#flights-advanced-options-pane').empty().append(advancedOptionsHtml);
            },
            triggerAirportFieldChange: function ($airportInput) {
                $airportInput.change();
                $airportInput.trigger('keyup');
                uitk.utils.focusElement($('#wizardSearch'));
            },
            publishUrl : function(url) {
                window.location.href = url;
            },

            renderErrors: function (errors) {
                var errorsToDisplay,
                    routeType = this.model.get('routeType');

                analytics.trackAction('FLT.SR.Wizard.BadParameters', $('#flight-wizard-search-button'));
                helpers.markControlsAsErrors(this.$el, routeType, errors);

                errorsToDisplay = helpers.filterDuplicateErrors(routeType, errors);

                this.$el.find('#wizard-error-container').html(
                    this.templates.wizardErrors({ errors: errorsToDisplay }));

                helpers.showAllErrorElements(this.$el);

                this.$el.find('#validation-alert').css('outline', 'none').focus();
            }
        });

        function populateCacheWithAsyncSearch(url) {
            var xhr = new XMLHttpRequest(),
                launchUrl = url.replace('Flights-Search', 'Flight-Launch-Search');

            if(configuration.enablePreloadFSRCache === false) {
                return;
            }

            xhr.open('GET', launchUrl, true);
            xhr.onload = function (e) {
                // nop
            };
            xhr.timeout = 10; // 10ms
            xhr.send(null);
        }
    });

/* static_content/default/default/scripts/exp/flights/flux/models/WizardModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('wizardModel', ['backbone', 'underscore', 'wizardModelValidator', 'travelerPreferencesModel', 'tripCollection', 'tripModel'], function(Backbone, _, WizardModelValidator, TravelerPreferencesModel, TripCollection, TripModel) {
    'use strict';

	var	mapToNewSchema = function(attributes) {
			var travelerPreferences = {
				airlineAgeRulesLink: attributes.airlineAgeRulesLink,
				airlines: attributes.airlines,
				numberOfAdults: attributes.adultCount,
				numberOfChildren: attributes.childCount,
				totalPassengers: attributes.totalPassengers,
				childAges: attributes.childAges,
				infantsInLap: attributes.infantsInLap,
				preferredAirline: attributes.preferredAirline,
				seatingClass: attributes.seatingClass,
				seatingClassList: attributes.seatingClassList,
				nonstopOnly: attributes.nonStop,
				refundableOnly: attributes.refundable,
				seniorCount:attributes.seniorCount
			};

			delete attributes.airlineAgeRulesLink;
			delete attributes.airlines;
			delete attributes.calendar;
			delete attributes.departure;
			delete attributes.arrival;
			delete attributes.adultCount;
			delete attributes.childCount;
			delete attributes.totalPassengers;
			delete attributes.childAges;
			delete attributes.infantsInLap;
			delete attributes.preferredAirline;
			delete attributes.seatingClass;
			delete attributes.seatingClassList;
			delete attributes.nonStop;
			delete attributes.refundable;
            delete attributes.seniorCount;

			attributes.travelerPreferences = travelerPreferences;

			return attributes;
		};

	return Backbone.Model.extend({
		constructor: function(attributes, options) {
			arguments[0] = mapToNewSchema(attributes);
			Backbone.Model.apply(this, arguments);
		},

		initialize: function() {
			this.set('trips', new TripCollection(this.get('trips'), this.get('locale')));
			this.set('travelerPreferences', new TravelerPreferencesModel(this.get('travelerPreferences')));
		},

		validate: function() {
			var errors = WizardModelValidator.validate(this);

			this.validationError = undefined;
			if (errors.length > 0) {
				this.validationError = errors;
				this.trigger('invalid', errors);
				return errors;
			}
		},

		isValid: function() {
			return this.validationError === undefined;
		},

		updateAirportsWithAirportCode: function() {
			var trips = this.get('trips');
			_.each(trips, function(trip, index) {
				var arrival = trips.at(index).get('arrival'),
				departure = trips.at(index).get('departure');

				arrival.set('airport', arrival.get('code'));
				departure.set('airport', departure.get('code'));
			});
		}
	});
});

/* static_content/default/default/scripts/exp/flights/flux/models/WizardModelValidator.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('wizardModelValidator', ['uitk', 'underscore'], function(uitk, _) {
	'use strict';

	var errors = [],
		validator = {
			errorTypes: {
				NO_ERROR: 0,
				MISSING_CHILD_AGE: 1,
				UNATTENDED_INFANT_IN_LAP: 2,
				INVALID_TRAVELER_COUNT: 3,
				MULTIPLE_DESTINATION: {
					DEPARTURE_AIRPORT_BLANK: 101,
					ARRIVAL_AIRPORT_BLANK: 102,
					DEPARTURE_ARRIVAL_AIRPORT_SAME: 103,
					INVALID_DEPARTURE_DATE: 104,
					DEPARTURE_DATE_NOT_IN_RANGE: 105,
					DEPARTURE_DATE_PRIOR_TO_PREVIOUS_TRIP: 151
				},
				ONE_WAY: {
					DEPARTURE_AIRPORT_BLANK: 201,
					ARRIVAL_AIRPORT_BLANK: 202,
					DEPARTURE_ARRIVAL_AIRPORT_SAME: 203,
					INVALID_DEPARTURE_DATE: 204,
					DEPARTURE_DATE_NOT_IN_RANGE: 205
				},
				ROUND_TRIP: {
                    DEPARTURE_AIRPORT_BLANK: 301,
                    ARRIVAL_AIRPORT_BLANK: 302,
                    DEPARTURE_ARRIVAL_AIRPORT_SAME: 303,
                    INVALID_DEPARTURE_DATE: 304,
					DEPARTURE_DATE_NOT_IN_RANGE: 305,
					INVALID_RETURN_DATE: 306,
					RETURN_DATE_NOT_IN_RANGE: 307
				}
			},

			validate: function (model) {
				var routeType = model.get('routeType'),
					trips = model.get('trips'),
					travelerPreferences = model.get('travelerPreferences'),
					locale = model.get('locale'),
					dateFormat = model.get('dateFormat'),
					validSearchDates = model.get('validSearchDates');

				errors = [];

				addTripsErrors(routeType, getTripsToValidateByRouteType(routeType, trips), locale, dateFormat, validSearchDates);
				addMissingChildAgeError(travelerPreferences);
				addUnattendedInfantInLapError(travelerPreferences);
				addInvalidTravelerCountError(travelerPreferences);

				return errors;
			}
		};

	// Iterate from the last to find the last non empty trip. 0..lastNonEmptyTripIndex are considered for validation. Rest are valid empty records.
	function findLastNonEmptyTripIndexToValidate(trips) {
		var reversedTripsArray = trips.toJSON().reverse(),
			lastNonEmptyTripIndex = 0;

		_.find(reversedTripsArray, function(trip, index) {
			if (!isTripEmpty(trip)) {
				lastNonEmptyTripIndex = trips.length - index - 1;
				return true;
			}
		});

		return lastNonEmptyTripIndex;
	}

	function getTripsToValidateByRouteType(routeType, trips) {
		if(routeType === 'ONE_WAY' || routeType === 'ROUND_TRIP') {
			return trips.slice(0, 1);
		}

		return trips.slice(0, findLastNonEmptyTripIndexToValidate(trips) + 1);
	}

	function addTripsErrors(routeType, trips, locale, dateFormat, validSearchDates) {
		var previousTrip;

		_.each(trips, function(trip, index) {
			if(previousTrip === undefined) {
				previousTrip = trip;
			}

			addTripErrors(routeType, trip, locale, index, previousTrip.get('departure').get('date').get('shortFormat'), dateFormat, validSearchDates);

			previousTrip = trip;
		});
	}

	function addTripErrors(routeType, trip, locale, index, earliestDate, dateFormat, validSearchDates) {
		var departureAirport = trip.get('departure').get('airport').trim(),
			arrivalAirport = trip.get('arrival').get('airport').trim(),
			departureDate = trip.get('departure').get('date').get('shortFormat'),
            returnDate = trip.get('arrival').get('date').get('shortFormat');

        if (isUndefinedOrEmptyString(departureAirport)) {
			errors.push({type: validator.errorTypes[routeType].DEPARTURE_AIRPORT_BLANK, index: index, tripNumber: index + 1});
		}

		if (isUndefinedOrEmptyString(arrivalAirport)) {
			errors.push({type: validator.errorTypes[routeType].ARRIVAL_AIRPORT_BLANK, index: index, tripNumber: index + 1});
		}

		if (!isUndefinedOrEmptyString(arrivalAirport) && departureAirport === arrivalAirport) {
			errors.push({type: validator.errorTypes[routeType].DEPARTURE_ARRIVAL_AIRPORT_SAME, index: index, tripNumber: index + 1});
		}

		if (!isValidTripDate(departureDate, earliestDate, locale)) {
			errors.push({type: validator.errorTypes[routeType].INVALID_DEPARTURE_DATE, index: index, tripNumber: index + 1, dateFormat: dateFormat});
		} else if (!isDateInRange(departureDate, earliestDate, locale, validSearchDates)) {
			errors.push({type: validator.errorTypes[routeType].DEPARTURE_DATE_NOT_IN_RANGE, index: index, tripNumber: index + 1, minDate: validSearchDates.min, maxDate: validSearchDates.max});
		} else {
			if (routeType === 'MULTIPLE_DESTINATION' && !isDateAfterPreviousDate(departureDate, earliestDate, locale)) {
				errors.push({type: validator.errorTypes[routeType].DEPARTURE_DATE_PRIOR_TO_PREVIOUS_TRIP, index: index, tripNumber: index + 1});
			}
		}

		if(routeType === 'ROUND_TRIP') {
            if (!isValidTripDate(returnDate, earliestDate, locale)) {
                errors.push({type: validator.errorTypes[routeType].INVALID_RETURN_DATE, index: index, tripNumber: index + 1, dateFormat: dateFormat});
            } else if (!isDateInRange(returnDate, earliestDate, locale, validSearchDates)) {
				errors.push({type: validator.errorTypes[routeType].RETURN_DATE_NOT_IN_RANGE, index: index, tripNumber: index + 1, minDate: validSearchDates.min, maxDate: validSearchDates.max});
			}
        }
	}

	function addMissingChildAgeError(travelerPreferences) {
		var childAges = travelerPreferences.get('childAges'),
			numberOfChildren = travelerPreferences.get('numberOfChildren');

		childAges.each(function (childAgeModel, index) {
			if (childAgeModel.get('age') < 0 && index < numberOfChildren) {
				errors.push({type: validator.errorTypes.MISSING_CHILD_AGE, index: index, childNumber: index + 1});
			}
		});
	}

	function addUnattendedInfantInLapError(travelerPreferences) {
		var numberOfInfantsInLap = 0,
			numberOfTwelveYearsOrOver = travelerPreferences.get('numberOfAdults'),
			numberOfChildren = travelerPreferences.get('numberOfChildren'),
			childAges = travelerPreferences.get('childAges'),
			infantInLap = travelerPreferences.get('infantsInLap');

		childAges.each(function (childAgeModel, index) {
			if (index >= numberOfChildren) {
				return false; //break
			}

			if (infantInLap && (childAgeModel.get('age') === 0 || childAgeModel.get('age') === 1)) {
				numberOfInfantsInLap += 1;
			}

			if (childAgeModel.get('age') >= 12) {
				numberOfTwelveYearsOrOver += 1;
			}
		});

		if (numberOfInfantsInLap > numberOfTwelveYearsOrOver) {
			errors.push({type: validator.errorTypes.UNATTENDED_INFANT_IN_LAP});
		}
	}

	function addInvalidTravelerCountError(travelerPreferences) {
		var MAX_ALLOWED_TRAVELERS = 6,
			totalTravellers = travelerPreferences.get('numberOfAdults') + travelerPreferences.get('numberOfChildren');

		if (totalTravellers > MAX_ALLOWED_TRAVELERS) {
			errors.push({type: validator.errorTypes.INVALID_TRAVELER_COUNT});
		}
	}

	function isUndefinedOrEmptyString (attribute) {
		return attribute === undefined || (typeof attribute === 'string' && attribute.length === 0);
	}

	function isTripEmpty(trip) {
		return isUndefinedOrEmptyString(trip.departure.get('airport')) &&
			isUndefinedOrEmptyString(trip.departure.get('date').get('shortFormat')) &&
			isUndefinedOrEmptyString(trip.arrival.get('airport')) &&
			isUndefinedOrEmptyString(trip.arrival.get('date').get('shortFormat'));
	}

	function isValidDate(date) {
		return (date instanceof Date) && !isNaN(date.getTime());
	}

	function isValidTripDate(date, earliestDate, locale) {
		var localeDepartureDate;

		if (isUndefinedOrEmptyString(date)) {
			return false;
		}

		localeDepartureDate = uitk.utils.createLocalizedDate(date, locale);
		if (!isValidDate(localeDepartureDate.date)) {
			return false;
		}

		return true;
	}

	function isDateAfterPreviousDate(date, earliestDate, locale) {
		var localeDepartureDate,
			localeEarliestDate;

		if (!isUndefinedOrEmptyString(earliestDate)) {
			localeEarliestDate = uitk.utils.createLocalizedDate(earliestDate, locale);

			if (isValidDate(localeEarliestDate.date)) {
				localeDepartureDate = uitk.utils.createLocalizedDate(date, locale);
				return localeDepartureDate.date.getTime() >= localeEarliestDate.date.getTime();
			}
		}

		return true;
	}

	function isDateInRange(date, earliestDate, locale, validSearchDates) {
		var minDateMilliseconds = uitk.utils.createLocalizedDate(validSearchDates.min, locale).date.getTime(),
			maxDateMilliseconds = uitk.utils.createLocalizedDate(validSearchDates.max, locale).date.getTime(),
			localeDateMilliseconds = uitk.utils.createLocalizedDate(date, locale).date.getTime();

		return localeDateMilliseconds >= minDateMilliseconds && localeDateMilliseconds <= maxDateMilliseconds;
	}

	return validator;
});

/* static_content/default/default/scripts/exp/flights/flux/models/TravelerPreferencesModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('travelerPreferencesModel', ['backbone', 'underscore'], function(Backbone, _) {
    'use strict';

	var	maxNumberOfChildrenEntries = 5;

    return Backbone.Model.extend({
		initialize: function() {
			var ageCollection = [],
				ages = this.get('childAges');

			_.times(maxNumberOfChildrenEntries, function(index) {
				var age = (index < ages.length) ? ages[index] : -1;
				ageCollection.push({age: age});
			});

			this.set('childAges', new Backbone.Collection(ageCollection));
			this.updateHasChildUnderTwo();

			this.listenTo(this.get('childAges'), 'change', this.updateHasChildUnderTwo);
		},

		updateHasChildUnderTwo: function() {
			var hasChildUnderTwo = false,
				numberOfChildren = this.get('numberOfChildren');

			this.get('childAges').each(function(model, index) {
				if(index >= numberOfChildren || hasChildUnderTwo) {
					return false; // break
				}

				if(model.get('age') === 0 || model.get('age') === 1) {
					hasChildUnderTwo = true;
				}
			});

			this.set('hasChildUnderTwo', hasChildUnderTwo); 
		}
	});
});

/* static_content/default/default/scripts/exp/flights/flux/models/TripModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('tripModel', ['backbone', 'dateModel'], function(Backbone, DateModel) {
    'use strict';

    return Backbone.Model.extend({
        initialize: function(trip, options) {
            var locale = options.collection.locale,
                departureDate = this.attributes.departure.date,
                arrivalDate = this.attributes.arrival.date,
                departureData,
                arrivalData;

            departureData = $.extend(true, {}, this.attributes.departure, {
                date: new DateModel(departureDate, locale)
            });
            this.set('departure', new Backbone.Model(departureData));

            arrivalData = $.extend(true, {}, this.attributes.arrival, {
                date: new DateModel(arrivalDate, locale)
            });
            this.set('arrival', new Backbone.Model(arrivalData));
        }
    });
});

/* static_content/default/default/scripts/exp/flights/flux/models/DateModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('dateModel', ['backbone', 'uitk'], function(Backbone, uitk) {
    'use strict';

    return Backbone.Model.extend({
        initialize: function(shortDate, locale) {
            this.locale = locale;
            this.attributes.shortFormat = shortDate;
        },
        toFullDateString: function(){
            var locale = this.locale,
                date = this.get('shortFormat');
            if (date !== '') {
                return uitk.utils.createLocalizedDate(date, locale).fullDate();
            }
            return '';

        },
        toMediumDateString: function(){
            var locale = this.locale,
                date = this.get('shortFormat');
            if (date !== '') {
                return uitk.utils.createLocalizedDate(date, locale).mediumDate();
            }
            return '';
        }
    });
});

/* static_content/default/default/scripts/exp/flights/flux/collections/TripCollection.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('tripCollection', ['tripModel', 'backbone', 'underscore', 'dateModel'], function(TripModel, Backbone, _, DateModel) {
    'use strict';

    function getLastTravelDate(route){
        var lastDateIndex;
        if (route === 'ROUND_TRIP') {
            lastDateIndex =  _.findLastIndex(this.models, function (trip) {
                return trip.get('arrival').get('date').get('shortFormat') !== '';
            });

            return this.at(lastDateIndex).get('arrival').get('date');
        }

        if (route === 'MULTIPLE_DESTINATION') {
            lastDateIndex =  _.findLastIndex(this.models, function (trip) {
                return trip.get('departure').get('date').get('shortFormat') !== '';
            });

            return this.at(lastDateIndex).get('departure').get('date');
        }

        return new DateModel('', '');
    }

    return Backbone.Collection.extend({
        initialize: function(trips, locale) {
            this.locale = locale;
        },
        model: TripModel,
        getLastTravelDate: getLastTravelDate
    });
});

/* static_content/default/default/scripts/exp/flights/flux/models/PageCriteriaModel.js */
/*jslint this: true */
/*global define */

define('pageCriteriaModel', ['jquery', 'sort.UiModel', 'backbone', 'i18n', 'configuration','flights', 'experiments'],
    function ($, sorts, Backbone, i18n, configuration, flights, experiments) {

    'use strict';

    var shouldAddUniqueLeg = false;

    var PageCriteriaModel = Backbone.Model.extend({
        defaults: {
            fetchOrigin: 'InitialSearch',
            interstitialMessage: i18n.filters.interstitial.generic,
            continuationId: $('#originalContinuationId').text(),
            chunk: {
                number: 0,
                size: configuration.pagination.initialRequestOfferCount
            },
            filter: {},
            sort: {
                type: (configuration.loyalty.partnerPointsEnabled) ? 'so' : 'sp',
                direction: sorts.SORT_DIRECTION.ASCENDING
            },
            currentPageNumber:1,
            packageType: ''
        },
        initialize: function (options) {
            var self = this;
            shouldAddUniqueLeg = options.shouldAddUniqueLeg;
            self.set('packageType', options.packageType);
            flights.vent.once('uiModel.resultsFetchSuccess', function () {
                self.set('chunk', {
                    number: self.get('chunk').number,
                    size: configuration.pagination.numOffersPerPage
                }, {silent: true});
            });
        },
        setPaginationCriteria: function(paginationModel) {
            var pageNumber,
                interstitialMessage;

            pageNumber = paginationModel.get('currentPageNumber');
            interstitialMessage = paginationModel.get('messageTemplate').replace('{0}', pageNumber);

            this.set({
                    currentPageNumber: pageNumber,
                    fetchOrigin: paginationModel.get('name'),
                    interstitialMessage: interstitialMessage
                });
        },
        isInitialSearch: function () {
            return (this.get('fetchOrigin').toLowerCase().indexOf(this.defaults.fetchOrigin.toLowerCase()) >= 0);
        },
        setShouldAddUniqueLeg: function (addUniqueLeg) {
            shouldAddUniqueLeg = addUniqueLeg;
        },
        getLegNumberFromCriteria: function (criteriaString) {
            var legNumberAsString = criteriaString.match(/^.*?(\d+)?$/i)[1];

            if ('string' === typeof legNumberAsString) {
                return parseInt(legNumberAsString, 10);
            }

            return;

        },
        getTypeFromCriteria: function (criteriaString) {
            return criteriaString.match(/^(.*?)(?:\d+)?$/i)[1];
        },
        toJSON: function () {
            var thisChunk = this.get('chunk'),
                thisSort = this.get('sort'),
                packageType = this.get('packageType'),
                pagination =  {cz: thisChunk.size, cn: this.get('currentPageNumber') -1 },
                sort = {},
                uniqueLeg = 0,
                json;

            sort[thisSort.type] = thisSort.direction;

            json = $.extend({
                c: $('#originalContinuationId').text(),
                is: (true === this.isInitialSearch() ? 1 : 0)
            }, this.get('filter'), sort, pagination);

            if(true === shouldAddUniqueLeg) {
                if(undefined !== json.fl0) {
                    uniqueLeg = 1;
                }

                json.ul = uniqueLeg;
            }

            // If there is a non-flight-only packageType, include it in the criteria so that it is included in the
            // /Flight-Search-Paging url so that the performance testing scripts can differentiate between SA flights
            // and package flights.
            if(typeof(packageType) !== "undefined" && packageType !== "" && packageType !== "f") {
                json.packageType = packageType;
            }

            experiments.execute('FSR_Listing_Details_Separation', json);

            return json;
        }
    });

    return new PageCriteriaModel({
        shouldAddUniqueLeg: configuration.view.isByot,
        packageType: configuration.path.type
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/UiModel/filter.UiModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('filter.UiModel', ['jquery', 'underscore'], function($, _) {
    'use strict';

    var times = { em: 'EARLYMORNING', m: 'MORNING', a: 'AFTERNOON', e: 'EVENING'},
        FILTER_TYPE = {
            STOPS: 'fs',
            AIRLINE: 'fa',
            STRICT_AIRLINE: 'fas',
            ARRIVAL_TIME: 'fr',
            DEPARTURE_TIME: 'fd',
            ORIGIN_AIRPORT: 'fao',
            DESTINATION_AIRPORT: 'fad',
            LEG: 'fl'
        },
        filters = {},
        fnCache = {};

    function getAirportFilterFunction(values, leg, property) {
        return function(offer) {
            return _.indexOf(values, offer.get('legs')[leg][property].airportCode) !== -1;
        };
    }

    function getTimeOfDayFilterFunction(values, leg, property){
        var fullValues = _.map(values, function(val){
            return times[val];
        });

        return function(offer) {
            return _.indexOf(fullValues, offer.get('legs')[leg].duration[property]) !== -1;
        };
    }

    filters[FILTER_TYPE.STOPS] = function (values, leg) {
        var filterByNonStop = _.indexOf(values, '0') !== -1,
            filterByOneStop = _.indexOf(values, '1') !== -1,
            filterByTwoStop = _.indexOf(values, '2') !== -1;

        return function (offer) {
            var meetsCriteria = false,
                offerStops = offer.numStopsForFilters(leg);

            if (filterByNonStop) {
                meetsCriteria = (meetsCriteria || offerStops === 0);
            }

            if (filterByOneStop) {
                meetsCriteria = (meetsCriteria || offerStops === 1);
            }

            if (filterByTwoStop) {
                meetsCriteria = (meetsCriteria || offerStops >= 2);
            }

            return meetsCriteria;
        };
    };

    filters[FILTER_TYPE.AIRLINE] = function (values, legIndex) {
        return function (offer) {
            var meetsCriteria = false,
                airlines = _.uniq(values);

            _.each(offer.get('legs'), function (leg, i) {
                // In case of Complete trip (RTV), the legIndex would not be specified
                if(legIndex === undefined || i === legIndex){
                    _.each(airlines, function (airline, j) {
                        meetsCriteria = (meetsCriteria || _.indexOf(leg.carrierSummary.airlineCodes, airline) !== -1);
                    });
                }
            });
            return meetsCriteria;
        };
    };

    filters[FILTER_TYPE.DEPARTURE_TIME] = function (values, leg) {
        return getTimeOfDayFilterFunction(values, leg, 'departureTimeOfDay');
    };

    filters[FILTER_TYPE.ARRIVAL_TIME] = function (values, leg) {
        return getTimeOfDayFilterFunction(values, leg, 'arrivalTimeOfDay');
    };

    filters[FILTER_TYPE.ORIGIN_AIRPORT] = function (values, leg) {
        return getAirportFilterFunction(values, leg, 'departureLocation');
    };

    filters[FILTER_TYPE.DESTINATION_AIRPORT] = function (values, leg) {
        return getAirportFilterFunction(values, leg, 'arrivalLocation');
    };

    filters[FILTER_TYPE.LEG] = function (values, leg) {
        return function (offer) {
            return offer.get('legIds')[leg] === values[0];
        };
    };

    return {
        get: function(options){
            var func,
                funcKey = options.type + '-' + options.values + '-' + options.leg;

            try {

                if(undefined === fnCache[funcKey]){
                    func = filters[options.type](options.values.split(','), options.leg);
                    fnCache[funcKey] = function(offer) {
                        return !offer.get('bargainOffer') && func(offer);
                    };
                }

                return fnCache[funcKey];
            } catch (e) {
                console.log(e);
                return $.noop;
            }
        },
        add: function (identifier, callback) {
            filters[identifier] = callback;
        },
        FILTER_TYPE: FILTER_TYPE
    };
});
/* static_content/default/default/scripts/exp/flights/flux/models/UiModel/offerModel.uiModel.js */
/*jslint this: true */
/*global define, Backbone, _ */

define('offerModel.uiModel', ['backbone'], function (Backbone) {
    'use strict';

    return Backbone.Model.extend({

        numStopsForFilters: function (legIndex) {
            var maxStops = 0,
                legs = this.get('legs');

            if(legIndex !== undefined) {
                return legs[legIndex].stops;
            }

            _.each(legs, function (leg) {
                maxStops = Math.max(maxStops, leg.stops);
            });

            return maxStops;
        },

        getTotalDurationInMinutes: function (legIndex) {
            var totalDuration = 0,
                legs = this.get('legs');

            if(legIndex !== undefined){
                return (legs[legIndex].duration.hours * 60) + legs[legIndex].duration.minutes;
            }

            _.each(legs, function (leg) {
                totalDuration += (leg.duration.hours * 60) + leg.duration.minutes;
            });

            return totalDuration;
        }

    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/UiModel/offersCollection.UiModel.js */
/*global define, Backbone */

/* Due to an incompatibility between Backbone and Modulizr, we are
 * using Backbone in the global namespace rather than make it an AMD
 * dependency.
 */

define('offersCollection.UiModel', ['offerModel.uiModel'], function (OfferModel) {
    'use strict';
    return Backbone.Collection.extend({
        model: OfferModel
    });
});
/* static_content/default/default/scripts/exp/flights/flux/models/UiModel/sort.UiModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('sort.UiModel', ['jquery'], function($) {
    'use strict';

    var DIRECTION = {
            ASCENDING: 'asc',
            DESCENDING: 'desc'
        },
        TYPE = {
            PRICE: 'sp',
            DURATION: 'st',
            DEPARTURE_TIME: 'sd',
            ARRIVAL_TIME: 'sa'
        },
        comparators = {},
        fnCache = {},
        useDurationOfSingleLeg;

    function getSortFunctionName(type, direction) {
        return [type, direction].join('-');
    }

    function comparePrice(offerA, offerB) {
        var aPrice = offerA.get('price').totalPriceAsDecimal,
            bPrice = offerB.get('price').totalPriceAsDecimal;

        if (aPrice === null) {
            return 1;
        }
        if (bPrice === null) {
            return -1;
        }
        return aPrice - bPrice;

    }

    comparators[getSortFunctionName(TYPE.PRICE, DIRECTION.ASCENDING)] = function(leg) {
        return function (offerA, offerB) { // primary: price, secondary: duration, tertiary: departure time
            var aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal,
                aDuration = offerA.getTotalDurationInMinutes(leg),
                bDuration = offerB.getTotalDurationInMinutes(leg),
                tertiarySortLeg = leg === undefined ? 0 : leg;

            if (aPrice === bPrice) {
                if(aDuration === bDuration) {
                    return offerA.get('legs')[tertiarySortLeg].departureTime.dateTime - offerB.get('legs')[tertiarySortLeg].departureTime.dateTime;
                }
                return aDuration - bDuration;
            }
            return comparePrice(offerA, offerB);
        };
    };

    comparators[getSortFunctionName(TYPE.PRICE, DIRECTION.DESCENDING)] = function(leg) {
        return function (offerA, offerB) { // primary: price, secondary: duration, tertiary: departure time
            var aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal,
                aDuration = offerA.getTotalDurationInMinutes(leg),
                bDuration = offerB.getTotalDurationInMinutes(leg),
                tertiarySortLeg = leg === undefined ? 0 : leg;

            if (aPrice === bPrice) {
                if(aDuration === bDuration) {
                    return offerA.get('legs')[tertiarySortLeg].departureTime.dateTime - offerB.get('legs')[tertiarySortLeg].departureTime.dateTime;
                }
                return aDuration - bDuration;
            }
            return comparePrice(offerB, offerA);
        };
    };

    comparators[getSortFunctionName(TYPE.DURATION, DIRECTION.ASCENDING)] = function(leg) {
        return function (offerA, offerB) { // primary: duration, secondary: price, tertiary: departure time
            var aDuration = offerA.getTotalDurationInMinutes(leg),
                bDuration = offerB.getTotalDurationInMinutes(leg),
                aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal,
                tertiarySortLeg = leg === undefined ? 0 : leg;

            if (aDuration === bDuration) {
                if (aPrice === bPrice) {
                    return offerA.get('legs')[tertiarySortLeg].departureTime.dateTime - offerB.get('legs')[tertiarySortLeg].departureTime.dateTime;
                }
                return comparePrice(offerA, offerB);
            }
            return aDuration - bDuration;
        };
    };

    comparators[getSortFunctionName(TYPE.DURATION, DIRECTION.DESCENDING)] = function(leg) {
        return function (offerA, offerB) { // primary: duration, secondary: price, tertiary: departure time
            var aDuration = offerA.getTotalDurationInMinutes(leg),
                bDuration = offerB.getTotalDurationInMinutes(leg),
                aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal,
                tertiarySortLeg = leg === undefined ? 0 : leg;

            if (aDuration === bDuration) {
                if (aPrice === bPrice) {
                    return offerA.get('legs')[tertiarySortLeg].departureTime.dateTime - offerB.get('legs')[tertiarySortLeg].departureTime.dateTime;
                }
                return comparePrice(offerA, offerB);
            }
            return bDuration - aDuration;
        };
    };

    comparators[getSortFunctionName(TYPE.DEPARTURE_TIME, DIRECTION.ASCENDING)] = function(leg) {
        return function (offerA, offerB) { // primary: departure time, secondary: price, tertiary: duration
            var aDeparture = offerA.get('legs')[leg].departureTime.dateTime,
                bDeparture = offerB.get('legs')[leg].departureTime.dateTime,
                aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal;

            if (aDeparture === bDeparture) {
                if (aPrice === bPrice) {
                    if(useDurationOfSingleLeg){
                        return offerA.getTotalDurationInMinutes(leg) - offerB.getTotalDurationInMinutes(leg);
                    }
                    return offerA.getTotalDurationInMinutes() - offerB.getTotalDurationInMinutes();
                }
                return comparePrice(offerA, offerB);
            }
            return aDeparture - bDeparture;
        };
    };

    comparators[getSortFunctionName(TYPE.DEPARTURE_TIME, DIRECTION.DESCENDING)] = function(leg) {
        return function (offerA, offerB) { // primary: departure time, secondary: price, tertiary: duration
            var aDeparture = offerA.get('legs')[leg].departureTime.dateTime,
                bDeparture = offerB.get('legs')[leg].departureTime.dateTime,
                aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal;

            if (aDeparture === bDeparture) {
                if (aPrice === bPrice) {
                    if(useDurationOfSingleLeg){
                        return offerA.getTotalDurationInMinutes(leg) - offerB.getTotalDurationInMinutes(leg);
                    }
                    return offerA.getTotalDurationInMinutes() - offerB.getTotalDurationInMinutes();
                }
                return comparePrice(offerA, offerB);
            }
            return bDeparture - aDeparture;
        };
    };

    comparators[getSortFunctionName(TYPE.ARRIVAL_TIME, DIRECTION.ASCENDING)] = function(leg) {
        // Sort criteria:
        // - primary: arrival time : ASC
        // - secondary: price : ASC
        // - tertiary: duration : ASC
        return function (offerA, offerB) {
            var aArrival = offerA.get('legs')[leg].arrivalTime.dateTime,
                bArrival = offerB.get('legs')[leg].arrivalTime.dateTime,
                aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal;

            if (aArrival === bArrival) {
                if (aPrice === bPrice) {
                    if(useDurationOfSingleLeg){
                        return offerA.getTotalDurationInMinutes(leg) - offerB.getTotalDurationInMinutes(leg);
                    }
                    return offerA.getTotalDurationInMinutes() - offerB.getTotalDurationInMinutes();
                }
                return comparePrice(offerA, offerB);
            }
            return aArrival - bArrival;
        };
    };
    comparators[getSortFunctionName(TYPE.ARRIVAL_TIME, DIRECTION.DESCENDING)] = function(leg) {
        return function (offerA, offerB) { // primary: arrival time, secondary: price, tertiary: duration
            var aArrival = offerA.get('legs')[leg].arrivalTime.dateTime,
                bArrival = offerB.get('legs')[leg].arrivalTime.dateTime,
                aPrice = offerA.get('price').totalPriceAsDecimal,
                bPrice = offerB.get('price').totalPriceAsDecimal;

            if (aArrival === bArrival) {
                if (aPrice === bPrice) {
                    if(useDurationOfSingleLeg){
                        return offerA.getTotalDurationInMinutes(leg) - offerB.getTotalDurationInMinutes(leg);
                    }
                    return offerA.getTotalDurationInMinutes() - offerB.getTotalDurationInMinutes();
                }
                return comparePrice(offerA, offerB);
            }
            return bArrival - aArrival;
        };
    };

    return {
        get: function(options){
            var funcKey;

            useDurationOfSingleLeg = typeof options.useDurationOfSingleLeg === 'boolean' ? options.useDurationOfSingleLeg : false;

            try {
                funcKey = options.type + options.direction + options.leg + useDurationOfSingleLeg;

                if(undefined === fnCache[funcKey]) {
                    fnCache[funcKey] = comparators[getSortFunctionName(options.type, options.direction)](options.leg);
                }

                return fnCache[funcKey];
            } catch (e) {
                console.log(e);
                return $.noop;
            }
        },
        SORT_TYPE: TYPE,
        SORT_DIRECTION: DIRECTION
    };
});
/* static_content/default/default/scripts/exp/flights/flux/models/UiModel/UiModel.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('uiModel',
        ['flights', 'jquery', 'dctk/dctk', 'filter.UiModel', 'sort.UiModel', 'offersCollection.UiModel', 'backbone', 'underscore', 'pageCriteriaModel', 'applicationViewLogging', 'universalDataObjectAjaxUtils', 'configuration', 'analytics', 'fetchConfiguration.UiModel', 'ajaxErrorModel', 'experiments'],
        function(flights, $, dctk, filters, sorts, OffersCollection, Backbone, _, pageCriteriaModel, applicationViewLogging, universalDataObjectAjaxUtils, configuration, analytics, fetchConfiguration, ajaxErrorModel, experiments) {

    'use strict';

    var previousContentModel,
        cacheType,
        rawData,
        pendingRequest,
        serverDeferred,
        clientDeferred,
        clientDefferedTimeout;

    Backbone.$ = $;

    rawData = {
        index: [],
        legs: {},
        offers: {},
        partnerLoyaltyDataMap: {},
        merge: function (model) {
            var self = this;

            if(undefined === model) {
                throw '`model` is undefined';
            }

            if(undefined === model.index) {
                throw '`model.index` is undefined';
            }

            if(undefined === model.legs) {
                throw '`model.legs` is undefined';
            }

            if(undefined === model.offers) {
                throw '`model.offers` is undefined';
            }

            self.index = model.index;

            _.each(model.legs, function (leg, key) {
                self.legs[key] = leg;
            });

            _.each(model.offers, function (offer, key) {
                self.offers[key] = offer;
            });

            if (configuration.loyalty.partnerPointsEnabled) {
                self.partnerLoyaltyDataMap = model.partnerLoyaltyDataMap;
            }

        }
    };

    function generateOffers(indexes) {
        var offers = [];

        $.each(indexes, function (i, offerKey) {
            var offer = rawData.offers[offerKey];
            offer.legs = [];

            $.each(offer.legIds, function (j, legId) {
                offer.legs.push(rawData.legs[legId]);
            });

            offer.numLegs = offer.legs.length;

            if (rawData.partnerLoyaltyDataMap && rawData.partnerLoyaltyDataMap[offerKey] !== undefined) {
                offer.partnerLoyaltyData = rawData.partnerLoyaltyDataMap[offerKey];
            }

            if(previousContentModel) {
                offer.resultToken = previousContentModel.resultToken;

                if (previousContentModel.multiItemDetails) {
                    offer.price.anchoredPrice = previousContentModel.multiItemDetails.totalFare;
                    offer.price.isPositiveDelta = offer.price.roundedBestPriceDelta >= 0;
                    offer.price.absoluteValuePrice = offer.price.formattedRoundedBestPriceDelta.replace('-', '');
                }
            }

            offers.push(offer);
        });

        return offers;
    }

    function updateLegsCollection(legs) {
        flights.collections.legsCollection.set(legs);
        flights.collections.legsCollection.trigger('change');
    }

    var UiModel = Backbone.Model.extend({
        url: '/Flight-Search-Paging',
        parse: function (data) {
            var content;

            content = data.content;

            if (undefined !== content) {
                this.addCacheInfo(content, {
                    isCached: false
                });
            }

            if (undefined !== previousContentModel && (undefined === content || 0 === _.keys(content.offers).length)) {
                return previousContentModel;
            }

            return content;
        },
        staleTimeout: configuration.modalTimerMinutes * 60  * 1000,
        rawData: rawData,
        addCacheInfo: function (contentModel, cacheInfo) {

            if (null === contentModel.offers) {
                return;
            }

            $.each(contentModel.offers, function(key, offer){
                offer.isCached = cacheInfo.isCached;
                offer.freshness = cacheInfo.freshness;
            });
        },
        loadContentModel: function (contentModel) {
            previousContentModel = contentModel;
            this.rawData.merge(contentModel);

            if (experiments.getVariant(13327) > 0) {
                this.set('legs', contentModel.legs);
            }

            this.refreshViewableOffers();
        },
        viewableOffers: new OffersCollection(),
        refreshViewableOffers: function(){
            this.viewableOffers.set(generateOffers(this.rawData.index));
        },
        setCacheType: function (aCacheType) {
            cacheType = aCacheType;
        },
        getCacheType: function () {
            return cacheType;
        },
        resetViewableOffers: function (offers, options) {
            var source = options && options.source ? options.source : '',
                logErrorData,
                renderTimeStart, renderTimeEnd;

            ajaxErrorModel.resetToDefaults();

            if (false === (offers instanceof Array)) {
                throw new Error('You must pass an instance of `Array`');
            }

            renderTimeStart = applicationViewLogging.getNowTime();

            experiments.execute('FSR_Memoize_Offer_Templates', {source: source});
            this.viewableOffers.reset(offers);

            renderTimeEnd = applicationViewLogging.getNowTime();
            experiments.execute('FSR_Memoize_Offer_Templates_Log.LogEvent', {
                renderTimeStart: renderTimeStart,
                renderTimeEnd: renderTimeEnd
            });

            flights.vent.trigger('uiModel.resetViewableOffers', {source: source});

            if (0 === this.viewableOffers.length) {
                logErrorData = ['origin=uiModel.resetViewableOffers'];

                this.trigger('noFlightsFound', {logErrorData: logErrorData});
                flights.vent.trigger('noFlightsFound');

                ajaxErrorModel.set({
                    errorStatus: ajaxErrorModel.ERROR_CODES.NO_FLIGHTS_FOUND,
                    options: {
                        origin: pageCriteriaModel.get('fetchOrigin')
                    },
                    logData: logErrorData
                });
            }
        },
        isEmpty: function () {
            return $.isEmptyObject(this.rawData.offers);
        },

        fetchRawData: function (callbacks) {
            var self = this,
                startTime = applicationViewLogging.getNowTime(),
                fetchOrigin = pageCriteriaModel.get('fetchOrigin'),
                criteriaJSON = pageCriteriaModel.toJSON(),
                errorLogData = ['origin=uiModel.requestOffers'];

            if (dctk && dctk.ewePerformance) {
                dctk.ewePerformance.mark('requestLiveOffers');
            }
            flights.vent.trigger('uiModel.fetching', {
                cacheType: cacheType,
                fetchOrigin: fetchOrigin
            });

            this.fetch({
                data: criteriaJSON,
                timeout: 90000,
                success: function (model, response, options) {
                    var content, successCheckPointInMS, errorInfo, pageName, summary;

                    if (dctk && dctk.ewePerformance) {
                        dctk.ewePerformance.mark('requestLiveOffersSuccess');
                        dctk.ewePerformance.measure('pageDataFetchTime', 'requestLiveOffers', 'requestLiveOffersSuccess');
                    }
                    previousContentModel = model.toJSON();
                    successCheckPointInMS = applicationViewLogging.getNowTime();

                    content = response.content;

                    summary = model.get('summary');

                    if(summary && summary.discountAvailable) {
                        analytics.updateOmnitureProperty('events', 'event12,event54,event203');
                    } else {
                        analytics.updateOmnitureProperty('events', 'event12,event54');
                    }

                    if('ACCEPT' === model.get('omniture').status) {
                        analytics.updateOmnitureData($.parseJSON(model.get('omniture').json));
                    }

                    if(content.universalDataObject !== null) {
                        pageName = content.universalDataObject.pageInfo.pageName;
                    } else {
                        pageName = dctk.omtr.pageName;
                    }

                    flights.vent.trigger('uiModel.pageNameReceived.' + fetchOrigin, {
                        pageName: pageName
                    });

                    applicationViewLogging.logPerformanceModelResults(response, options);

                    if(content && content.errorData && content.errorData.error){
                        clientDeferred.fail(function() {
                            errorInfo = {
                                errorStatus: content.errorData.status,
                                logData: errorLogData
                            };

                            errorLogData.push('errorDescription=' + content.errorData.description);
                            errorLogData.push('errorCode=' + content.errorData.status);

                            if (content.errorData.eventName) {
                                errorLogData.push('errorEventName=' + content.errorData.eventName);
                            }

                            self.trigger('responseError', errorInfo);
                            self.trigger('responseError.' + fetchOrigin, {
                                errorInfo: errorInfo,
                                pageName: pageName
                            });

                            ajaxErrorModel.set({
                                errorStatus: errorInfo.errorStatus,
                                options: {
                                    origin: pageCriteriaModel.get('fetchOrigin')
                                },
                                logData: errorInfo.logData
                            });

                            if (undefined !== callbacks && 'function' === typeof callbacks.error) {
                                callbacks.error(errorInfo);
                            }
                        });
                        return;
                    }

                    experiments.execute('FILTERS_EXPERIMENTS', {
                        legs: self.get('legs'),
                        offers: self.get('offers'),
                        isLive: true
                    });

                    universalDataObjectAjaxUtils.processUDOAndFirePixels(content);

                    applicationViewLogging.logEvent('FLUX_uiModel_AjaxDuration_' + fetchOrigin, startTime, successCheckPointInMS);

                    updateLegsCollection(model.get('legs'));

                    self.rawData.merge(model.attributes);


                    if (undefined !== callbacks && 'function' === typeof callbacks.success) {
                        callbacks.success(model, content, options);
                    }

                    flights.vent.trigger('uiModel.resultsFetchSuccess', {model: model, response: response});
                    flights.vent.trigger('uiModel.resultsFetchSuccess.' + fetchOrigin, {
                        model: model,
                        pageName: pageName
                    });
                },
                error: function (model, response, options) {
                    if(response.readyState === 0 && 'abort' === response.statusText) {
                        return;
                    }

                    clientDeferred.fail(function(){

                        flights.vent.trigger('uiModel.resultsFetchFailure', {response: response});
                        flights.vent.trigger('uiModel.resultsFetchFailure.' + fetchOrigin);

                        ajaxErrorModel.set({
                            errorStatus: response.statusText,
                            options: {
                                origin: pageCriteriaModel.get('fetchOrigin')
                            },
                            logData: errorLogData
                        });

                    });
                }
            });
        },

        filterCheapestUniqueLegs: function (offerSet, legIndex) {
            var filteredSet, cheapestPricesPerLeg = {};

            if(0 !== legIndex) {
                return offerSet;
            }

            offerSet.forEach(function (offer) {
                var legNaturalKey, previousOfferInfo, previousOfferExists, currentOfferPrice, currentOfferIsCtp, previousOfferIsCtp;

                if(offer.get('bargainOffer')) { return; }

                legNaturalKey = offer.get('legs')[legIndex].naturalKey;
                previousOfferInfo = cheapestPricesPerLeg[legNaturalKey];
                previousOfferExists = (undefined !== previousOfferInfo);
                currentOfferPrice = offer.get('price').totalPriceAsDecimal;
                currentOfferIsCtp = (null === currentOfferPrice);
                previousOfferIsCtp = (previousOfferExists && null === previousOfferInfo.price);

                if(previousOfferExists) {
                    if(currentOfferIsCtp) {
                        return;
                    }

                    if(!previousOfferIsCtp && previousOfferInfo.price < currentOfferPrice) {
                        return;
                    }
                }

                cheapestPricesPerLeg[legNaturalKey] = {
                    price: currentOfferPrice,
                    offerNaturalKey: offer.get('naturalKey')
                };
            });

            filteredSet = offerSet.filter(function (offer) {
                var legNaturalKey, offerNaturalKey, offerNaturalKeyForLeg;

                if(offer.get('bargainOffer')) { return true; }

                legNaturalKey = offer.get('legs')[legIndex].naturalKey;
                offerNaturalKey = offer.get('naturalKey');
                offerNaturalKeyForLeg = cheapestPricesPerLeg[legNaturalKey].offerNaturalKey;

                return offerNaturalKey === offerNaturalKeyForLeg;
            });

            return new OffersCollection(filteredSet);
        },

        filterSet: function (offerSet, filterCriteria) {
            var filteredSet,
                startTime;

            startTime = applicationViewLogging.getNowTime();

            if(0 === _.keys(filterCriteria).length) {
                return offerSet;
            }

            filteredSet = offerSet.toArray();
            $.each(filterCriteria, function (criteriaKey, criteriaValue) {
                var filterFn = filters.get({
                    type: pageCriteriaModel.getTypeFromCriteria(criteriaKey),
                    values: criteriaValue,
                    leg: pageCriteriaModel.getLegNumberFromCriteria(criteriaKey)
                });
                filteredSet = _.filter(filteredSet, filterFn);
            });
            applicationViewLogging.logEvent('FLUX_uiModel_FilterTime', startTime, applicationViewLogging.getNowTime());
            return new OffersCollection(filteredSet);
        },
        filterBargainOffers: function (offerSet, sortType) {
            var filteredSet;
            if (sortType !== sorts.SORT_TYPE.PRICE) {
                filteredSet = offerSet.filter(function (offer) {
                    return !offer.get('bargainOffer');
                });
                return new OffersCollection(filteredSet);
            }
            return offerSet;
        },
        sortSet: function(offerSet, sortCriteria) {
            var comparator,
                startTime;

            startTime = applicationViewLogging.getNowTime();

            comparator = sorts.get({
                type: pageCriteriaModel.getTypeFromCriteria(sortCriteria.type),
                direction: sortCriteria.direction,
                leg: configuration.view.isByot ? pageCriteriaModel.toJSON().ul : pageCriteriaModel.getLegNumberFromCriteria(sortCriteria.type),
                useDurationOfSingleLeg: configuration.view.isByot
            });

            offerSet.comparator = comparator;
            offerSet.sort();
            applicationViewLogging.logEvent('FLUX_uiModel_SortTime', startTime, applicationViewLogging.getNowTime());

        },
        chunkSet: function(offerSet, chunkCriteria) {
            var chunkBegin,
                chunkEnd;

            chunkBegin = chunkCriteria.size * chunkCriteria.number;
            chunkEnd = chunkBegin + chunkCriteria.size;

            return new OffersCollection(offerSet.slice(chunkBegin, chunkEnd));
        },

        removeCachedOffers: function(offerSet) {
            var liveOffers;

            liveOffers = _.filter(offerSet.toJSON(), function(offer){
                return false === offer.isCached;
            });

            return new OffersCollection(liveOffers);
        },

        preparePage: function (offersCollection) {
            var filterCriteria,
                sortCriteria,
                chunkCriteria,
                workingSet,
                liveOffers;

            workingSet = offersCollection;

            liveOffers = _.where(workingSet.toJSON(), {isCached: false});

            if(0 < liveOffers.length) {
                workingSet = this.removeCachedOffers(workingSet);
            }

            workingSet = this.filterCheapestUniqueLegs(workingSet, pageCriteriaModel.toJSON().ul);

            filterCriteria = pageCriteriaModel.get('filter');
            workingSet = this.filterSet(workingSet, filterCriteria);

            sortCriteria = pageCriteriaModel.get('sort');
            workingSet = this.filterBargainOffers(workingSet, pageCriteriaModel.getTypeFromCriteria(sortCriteria.type));

            this.sortSet(workingSet, sortCriteria);

            chunkCriteria = pageCriteriaModel.get('chunk');

            return this.chunkSet(workingSet, chunkCriteria);
        },
        selectLeg : function (naturalKey) {
          var leg = this.get('legs')[naturalKey];
            if (undefined === leg) {
                return;
            }
            leg.isSelected = true;
        },
        deselectLeg : function (naturalKey) {
            var leg = this.get('legs')[naturalKey];
            if (undefined === leg) {
                return;
            }
            leg.isSelected = false;
        },
        getPage: function (callback) {
            var self = this,
                offersCollection,
                fetchOrigin,
                shouldMakeRequest,
                shouldPerformClientOperations,
                hasClientResults;

            serverDeferred = $.Deferred();
            clientDeferred = $.Deferred();

            if (self.isEmpty()) {
                clientDeferred.reject();
                self.fetchRawData({
                    success: function(model, response, options){
                        var fullOffers = generateOffers(self.rawData.index);

                        if(fullOffers.length > 0) {
                            analytics.updateOmnitureProperty('prop52',
                                applicationViewLogging.generateListingOmnitureString(fullOffers[0]));
                        }

                        self.resetViewableOffers(fullOffers.slice(0, configuration.pagination.numOffersPerPage), {source: 'server'});
                        if ('function' === typeof callback) {
                            callback(model, response, options);
                        }
                    }
                });
                return;
            }

            fetchOrigin = pageCriteriaModel.get('fetchOrigin');
            shouldMakeRequest = fetchConfiguration.shouldMakeRequest(fetchOrigin);
            shouldPerformClientOperations = fetchConfiguration.shouldPerformClientOperations(fetchOrigin);

            if (shouldMakeRequest) {
                serverDeferred = $.Deferred(function (thisDeferred) {
                    self.fetchRawData({
                        success: function (model, response, options) {
                            var index;
                            if ('function' === typeof callback) {
                                callback(model, response, options);
                            }
                            index = typeof response.index === 'undefined' || response.index.length === 0 ? self.rawData.index : response.index;
                            offersCollection = new OffersCollection(generateOffers(index));
                            if (fetchOrigin !== 'Pagination') {
                                offersCollection = self.preparePage(offersCollection);
                            }

                            self.resetViewableOffers(offersCollection.toArray(), {source: 'server'});
                            flights.vent.trigger('uiModel.serverResultsRendered');
                            thisDeferred.resolve();
                            clearTimeout(clientDefferedTimeout);
                        }
                    });
                });
            }

            hasClientResults = false;
            if(shouldPerformClientOperations) {
                clientDeferred = $.Deferred(function (thisDeferred){
                    offersCollection = new OffersCollection(generateOffers(self.rawData.index));
                    offersCollection = self.preparePage(offersCollection);
                    hasClientResults = offersCollection.toArray().length > 0;
                    clearTimeout(clientDefferedTimeout);
                    clientDefferedTimeout = setTimeout(function () {
                        if (serverDeferred.state() !== 'resolved' &&
                            (!shouldMakeRequest || hasClientResults)) {
                            self.resetViewableOffers(offersCollection.toArray(), {source: 'client'});
                        }
                        if(false === hasClientResults) {
                            thisDeferred.reject();
                        }
                    }, configuration.byotFilterTime);
                });
            }

            if(false === hasClientResults) {
                clientDeferred.reject();
            }
        },
        fetch: function(options) {
          if('object' !== typeof options) {
            options = {};
          }

          if('object' === typeof pendingRequest &&
            pendingRequest.readyState !== 0 &&
            pendingRequest.readyState !== 4) {
            pendingRequest.abort();
          }

          pendingRequest = Backbone.Model.prototype.fetch.call(this, options);
          return pendingRequest;

        },

        initialize: function () {
            var self = this;
            // TODO: @refactor - This should happen when live results are returned
            // in ApplicationView.js but that module has no tests at all, so we're keeping it here
            setTimeout( function() {
                self.trigger('stale');
            }, self.staleTimeout);

            this.listenTo(pageCriteriaModel, 'change', function () {
                this.getPage();
            });
        }
    });
    return new UiModel();
});

/* static_content/default/default/scripts/exp/flights/flux/models/UiModel/fetchConfiguration.UiModel.js */
define('fetchConfiguration.UiModel', ['configuration'], function(configuration){
    'use strict';

    return {
        shouldMakeRequest: function(fetchOrigin){
            if(fetchOrigin === 'InitialSearch') {
                return true;
            }

            if(true === configuration.route.isOneWay) {
                return false;
            }

            if(false === configuration.view.isByot) {
                return true;
            }

            if(fetchOrigin === 'LegSelect') {
                return true;
            }

            if(fetchOrigin === 'LegUnselect') {
                return true;
            }

            return false;
        },
        shouldPerformClientOperations: function (fetchOrigin) {
            if(fetchOrigin === 'Pagination') {
                return false;
            }

            return !configuration.view.isByot || (fetchOrigin !== 'InitialSearch' && fetchOrigin !== 'LegSelect' && fetchOrigin !== 'LegUnselect');
        }
    };
});
/* static_content/default/default/scripts/exp/flights/flux/views/OffersCollectionView.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require */

define('offersCollectionView',
    ['jquery', 'underscore', 'flights', 'marionette', 'uitk', 'uiModel', 'standardOfferView', 'bargainOfferView', 'pageCriteriaModel', 'configuration', 'interstitial', 'progress', 'applicationViewLogging', 'i18n', 'experiments'],
    function ($, _, flights, Marionette, uitk, uiModel, standardOfferView, bargainOfferView, pageCriteriaModel, configuration, interstitial, progress, logging, i18n, experiments) {
    'use strict';

        function setLegForOffer(offer, legIndex) {
            var isStandardOffer = (false === offer.get('bargainOffer')),
                legs,
                legIds;

            if (true === isStandardOffer) {
                legs = offer.get('legs');
                legIds = offer.get('legIds');

                offer.set({
                    legs: [legs[legIndex]],
                    legIds: [legIds[legIndex]]
                });
            }
        }

        function setDeltaPriceForOffer(offer, legIndex) {
            var isFirstLeg = (0 === legIndex),
                price = offer.get('price');

            price.useDeltaPrice = configuration.useDeltaPrice && false === isFirstLeg;

            offer.set('price', price);
        }

        function setLegIndexListForOffer(offer) {
            var legIndexList = _.map(offer.get('legs'), function (leg) {
                return leg.identity.index;
            }).join(',');
            offer.set('legIndexList', legIndexList);
        }

        function setListingsA11yHeader($header) {
            if(undefined === $header || undefined === router) {
                return;
            }

            if (0 === router.getNextLegToView()) {
                $header.text(i18n.headers.departureResults);
            } else {
                $header.text(i18n.headers.returnResults);
            }
        }

    var router,
        checkpointTime,
        PAYBACK_POINTS = 100;

    function addLoyaltyPointsIfNecessary(model) {
        if(configuration.loyalty.enabled) {
            _.each(model.get('legs'), function (leg) {
                leg.awardValue = PAYBACK_POINTS;
            });
        }
    }

    var OffersCollectionView = Marionette.CollectionView.extend({
        childView: standardOfferView,
        interstitial: {
            $acol: $('#acol-interstitial'),
            $outboundSpinner: $('#outboundSpinner'),
            $pi: $('#pi-interstitial')
        },

        showInterstitial: function () {
            var $interstitial,
                message = pageCriteriaModel.get('interstitialMessage');

            if (pageCriteriaModel.isInitialSearch()) {
                if (configuration.perceivedInstantEnabled) {
                    $interstitial = this.interstitial.$pi;
                } else {
                    $interstitial = this.interstitial.$acol;
                }
                interstitial.show($interstitial, {elements: $interstitial.find('.progress-bar')});
            } else {
                progress.showOnPageInterstitial(message);
            }
        },

        hideInterstitial: function (source) {
            var shouldNotHideOnInitial = source === 'client' || source === 'reset';

            if (pageCriteriaModel.isInitialSearch() && shouldNotHideOnInitial) {
                return;
            }

            if (this.interstitial) {
                if (configuration.perceivedInstantEnabled) {
                    interstitial.hide(this.interstitial.$pi);
                } else {
                    interstitial.hide(this.interstitial.$acol);
                }
            }
            progress.hideInterstitial();
        },

        initialize: function (options) {
            var self = this;
            this.showInterstitial();
            this.listenTo(pageCriteriaModel, 'change', this.showInterstitial);
            this.listenTo(flights.vent, 'uiModel.resetViewableOffers', function (options) {
                if (typeof options === 'object' && options.source === 'server') {
                    self.hideInterstitial(options.source);
                }
            });
            this.listenTo(uiModel.viewableOffers, 'reset', function () {
                self.hideInterstitial('reset');
            });
            this.listenTo(uiModel, 'responseError', this.hideInterstitial);
            this.listenTo(flights.vent, 'uiModel.resultsFetchFailure', this.hideInterstitial);

            router = options.router;

            this.listenTo(flights.vent, 'router.noSelectedLegs router.selectedLegs', function () {
                setListingsA11yHeader(options.$listingsHeader);
            });
            setListingsA11yHeader(options.$listingsHeader);
        },

        onBeforeRender: function () {
            checkpointTime = logging.getNowTime();
        },

        onRenderCollection: function () {
            flights.vent.trigger('offersCollectionView.render');
            $('#cachedOfferList').remove(); //TODO: move this to cachedOfferListView during baseline/cleanup of 13222
            logging.logEvent('FLUX_ActualResultsRenderedDuration', checkpointTime, logging.getNowTime());
        },

        childViewOptions: function (model, index) {
            model.set('resultNumber', index + 1);
            addLoyaltyPointsIfNecessary(model);

            setLegIndexListForOffer(model);

            if(undefined !== router) {
                setLegForOffer(model, router.getNextLegToView());
                setDeltaPriceForOffer(model, router.getNextLegToView());
            }
        },
        getChildView: function(item) {
            if(item.get('bargainOffer')) {
                experiments.execute('FSRMobileSuppressEBFOffers');

                return bargainOfferView;
            }

            return standardOfferView;
        },

        getOfferElement: function (offerId) {
            var offerView = _.find(this.children._views, function (view) {
                return view.model.get('naturalKey') === offerId;
            });

            if(offerView === undefined) {
                return $('<div/>');
            }

            return offerView.$el;
        }
    });

    return OffersCollectionView;
});

/* static_content/default/default/scripts/exp/flights/flux/views/PageCriteriaController.js */
/*jslint nomen:true*/
/*global define */
define('pageCriteriaController',
    ['backbone', 'underscore', 'pageCriteriaModel', 'i18n', 'flights', 'configuration', 'experiments'],
    function (Backbone, _, pageCriteriaModel, i18n, flights, configuration, experiments) {
        'use strict';

        var filtersModel,
            sortModel,
            paginationModel,
            PageCriteriaController,
            routerEnabled = false,
            redesignedFilters = (experiments.getVariant(13347) > 0);

        function scrollToTop(callback){
            $('html, body').animate({
                scrollTop: 0
            }, 0, callback);
        }

        function initializeLegFilter () {
            require(['setupRouter'], function (setupRouter) {
                var currentHash = setupRouter().getCurrentFragment();

                if('' !== currentHash){
                    pageCriteriaModel.defaults.filter.fl0 = currentHash;
                    filtersModel.set('legFilters', {
                        fl0: currentHash
                    }, {silent: true});
                }
            });
        }

        function listenToRouterEvents (pageCriteriaController) {
            pageCriteriaController.listenTo(flights.vent, 'router.noSelectedLegs', function () {
                filtersModel.set('legFilters', {}, {silent: true});
                scrollToTop(function(){
                    setPageCriteriaModel({
                        fetchOrigin: 'LegUnselect',
                        interstitialMessage: i18n.searching.interstitial.departing,
                        filter: {},
                        sort: pageCriteriaModel.defaults.sort
                    });
                    experiments.execute('SCROLL_TO_CONTENT_MOBILE');
                });
            });


            pageCriteriaController.listenTo(flights.vent, 'router.selectedLegs', function (selectedLeg) {
                filtersModel.set('legFilters', {
                    fl0: selectedLeg
                }, {silent: true});
                scrollToTop(function(){
                    setPageCriteriaModel({
                        fetchOrigin: 'LegSelect',
                        interstitialMessage: i18n.searching.interstitial.returning,
                        filter: {
                            fl0: selectedLeg
                        },
                        sort: pageCriteriaModel.defaults.sort
                    });
                    experiments.execute('SCROLL_TO_CONTENT_MOBILE');
                });
            });
        }

        function setPageCriteriaModel(options) {
            var shouldGetFiltersFromPageCriteria = (routerEnabled || experiments.getVariant(13031) ||
                experiments.getVariant(13032) || experiments.getVariant(13030)) && !redesignedFilters;

            if (options.fetchOrigin && options.fetchOrigin !== 'Pagination') {
                paginationModel.set({
                    currentPageNumber: 1,
                    currentFirstResult: 1
                }, {silent: true});
            }

            options = _.extend({
                filter: shouldGetFiltersFromPageCriteria ? pageCriteriaModel.get('filter') : filtersModel.retrieveActiveFilters(), //TODO: fix this when FiltersView actually listens to FiltersModel properly
                sort: sortModel.retrieveActiveSort(),
                fetchOrigin: 'InitialSearch',
                interstitialMessage: i18n.filters.interstitial.generic,
                currentPageNumber: paginationModel.get('currentPageNumber'),
                chunk: {
                    number: paginationModel.get('currentPageNumber') - 1,
                    size: configuration.pagination.numOffersPerPage
                }
            }, options);

            pageCriteriaModel.set({
                filter: options.filter,
                sort: options.sort,
                fetchOrigin: options.fetchOrigin,
                interstitialMessage: options.interstitialMessage,
                currentPageNumber: options.currentPageNumber,
                chunk: options.chunk
            });
        }

        PageCriteriaController = function (options) {
            var pageCriteriaController = _.extend({}, Backbone.Events);

            filtersModel = options.filtersModel;
            sortModel = options.sortModel;
            paginationModel = options.paginationModel;
            routerEnabled = options.routerEnabled;

            pageCriteriaController.listenTo(filtersModel, 'change:legFilters', function (selectedLegs) {
                var legFiltersCount = _.keys(selectedLegs.get('legFilters')).length;

                setPageCriteriaModel({fetchOrigin: 'LegFilter' + legFiltersCount});
            });

            if(redesignedFilters) {
                pageCriteriaController.listenTo(filtersModel, 'change', function () {
                    setPageCriteriaModel({
                        filter: filtersModel.retrieveActiveFilters(),
                        fetchOrigin: 'Filter',
                        interstitialMessage: filtersModel.get('interstitialMessage')
                    });
                });

            } else {
                flights.vent.on('filtersView.filterSelected', function (options) {
                    var legFilters = filtersModel.get('legFilters');
                    setPageCriteriaModel({
                        filter: _.extend(options.filter, legFilters),
                        fetchOrigin: 'Filter',
                        interstitialMessage: options.interstitialMessage
                    });
                });

                flights.vent.on('filtersView.summaryUpdated', function () {
                    var filters = filtersModel.retrieveActiveFilters();
                    pageCriteriaModel.set('filter', filters, {silent: true});
                });
            }

            pageCriteriaController.listenTo(sortModel, 'change', function (sortModel) {
                setPageCriteriaModel({
                    fetchOrigin: 'Sort',
                    interstitialMessage: sortModel.get('interstitialMessage')
                });
            });

            pageCriteriaController.listenTo(paginationModel, 'change:currentPageNumber', function (paginationModel) {
                setPageCriteriaModel({
                    fetchOrigin: 'Pagination',
                    interstitialMessage: paginationModel.get('messageTemplate').replace('{0}', paginationModel.get('currentPageNumber'))
                });
            });

            if(true === routerEnabled) {
                initializeLegFilter();
                listenToRouterEvents(pageCriteriaController);
            }

            return pageCriteriaController;
        };

        return PageCriteriaController;
    });
/* static_content/default/default/scripts/exp/flights/flux/pageNameTracker.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define */

define('pageNameTracker', ['analytics'], function (analytics) {

    'use strict';

    function updatePageName(options) {
        analytics.updatePageNameForOmniture(options.pageName);
        analytics.trackPageLoad();
    }

    return {
        trackPageName: function (flights, uiModel) {
            flights.vent.on('uiModel.pageNameReceived.InitialSearch', updatePageName);
        },
        trackByotPageName: function (flights, uiModel) {
            flights.vent.on('uiModel.pageNameReceived.LegSelect', updatePageName);
            flights.vent.on('uiModel.pageNameReceived.LegUnselect', updatePageName);
        }
    };
});
/* static_content/default/default/scripts/exp/flights/flux/impressionDataForAnalytics.js */
/**
 * Created by vananthraman on 8/16/16.
 */
define('impressionDataForAnalytics', ['pageCriteriaModel', 'flights','uiModel', 'jquery', 'dctk/dctk', 'backbone', 'Impressions', 'promotionrulesmodel', 'configuration'], function(criteriaModel, flights,uiModel, $, dctk, Backbone, Impressions, promotionrulesmodel, configuration) {
    'use strict';

    var impressions,
        self,
        logUrl = "/cl/data/epcairofferimpression.json?stream=true&persist=true&rollup=Minute",
        pageName,
        areConditionsFine = false,
        impressionDataForAnalytics = {

            getSearchParameters: function() {

                if (self.searchParameters === undefined) {
                    self.searchParameters = $.parseJSON($('#wizardData').html());
                    delete self.searchParameters.typeAhead;
                    delete self.searchParameters.calendar;
                }

                return self.searchParameters;
            },
            getSessionId: function(model) {
                return model.get('continuationId');
            },

            getExperimentInfo: function() {
                self = this;
                var test = [],
                    experimentId = promotionrulesmodel.abacusExperimentId,
                    d = $.Deferred(),
                    resolvePromise = true;

                if(!$.isEmptyObject(promotionrulesmodel))
                {
                    resolvePromise = false;
                    dctk.evaluateExperiment({id: experimentId, callback: function(experiment) {
                        if (!experiment.error) {
                            test.push({
                                "experimentId": experimentId,
                                "bucketValue": experiment.value,
                                "instanceId": experiment.experiments[0].instanceId
                            });
                            self.tests = test;
                            self.promotionId = promotionrulesmodel.promotionId;
                        }
                        else {
                            dctk.logging.logError("FSR: ", experiment.error.message, {
                                error: "Failed to evaluate experiment:" + experimentId
                            });
                        }
                        d.resolve();
                    }});
                }
                if(resolvePromise) {
                    d.resolve();
                }
                self.tests = test;
                self.promotionId = undefined;
                return d.promise();
            },
            getTravelerInfo_InfantsInSeat_InfantsInLap: function(infantsinlap, childAges) {
                var infantCounts = {};
                var countChildUnderTwo = 0;
                var countChildOverTwo = 0;
                var i;
                for (i = 0; i < childAges.length; i++) {
                    if (childAges[i] <= 2) {
                        countChildUnderTwo++;
                    } else {
                        countChildOverTwo++;
                    }
                }
                if (infantsinlap) {
                    infantCounts.infantinLapCount = countChildUnderTwo;
                    infantCounts.infantinSeatCount = countChildOverTwo;
                } else {
                    infantCounts.infantinLapCount = 0;
                    infantCounts.infantinSeatCount = countChildUnderTwo + countChildOverTwo;
                }
                return infantCounts;
            },

            getOffersDataForEPCLogging: function(offersCollection) {
                var offersArray;

                offersArray = offersCollection.toJSON();
                var offerArraytoreturn = [];

                $.each(offersArray, function(position, offer) {
                    var arrayOfLegs = [];
                    if(typeof offer.legs !== 'undefined') {
                        var i;
                        var leg = {};
                        for (i = 0; i < offer.legs.length; i++) {
                            leg = {
                                carrierCode: offer.legs[i].carrierSummary.airlineCodes,
                                departureAirportCode: offer.legs[i].departureLocation.airportCode,
                                arrivalAirportCode: offer.legs[i].arrivalLocation.airportCode,
                                departureDateTime: offer.legs[i].departureTime.isoStr,
                                arrivalDateTime: offer.legs[i].arrivalTime.isoStr,
                                price: {
                                    totalPrice: (!offer.price.totalPriceAsDecimalString) ? undefined : offer.price.totalPriceAsDecimalString,
                                    currencyCode: (!offer.price.totalPriceAsDecimalString) ? undefined : offer.price.currencyCode
                                },
                                fareType: offer.legs[i].price.flightFareTypeCode
                            };
                            arrayOfLegs.push(leg);
                        }
                    }
                    var anOffer = {
                        piid: offer.piid,
                        splitTicket: offer.splitTicket,
                        legs: arrayOfLegs
                    };
                    offerArraytoreturn.push(anOffer);

                });

                return offerArraytoreturn;
            },

            populateLogData: function(logData) {

                logData = logData || {};

                var searchParams = self.getSearchParameters();
                var depairportStringlength = searchParams.departure.airport.length;
                var arrairportStringlength = searchParams.arrival.airport.length;
                var infantCount = self.getTravelerInfo_InfantsInSeat_InfantsInLap(searchParams.infantsInLap, searchParams.childAges);
                logData = $.extend(true, logData, {

                    context: {
                        user: {
                            guid: dctk._guid,
                            tuid: (typeof dctk.omtr !== 'undefined') ? dctk.omtr.prop11 : -1
                        },
                        site: {
                            tpid: dctk._tpid,
                            eapid: dctk._eapid
                        },
                        sessionId: self.getSessionId(criteriaModel),
                        purchasePath: "standalone"
                    },
                    pageInfo: {
                        pageName: dctk.omtr.pageName,
                        tripType:  (searchParams.routeType === "ONE_WAY") ? "OW" : ((searchParams.routeType === "ROUND_TRIP") ? "RT" : undefined)
                    },
                    travelerInfo: {
                        numberOfAdults: searchParams.adultCount,
                        numberOfSeniors: searchParams.seniorCount,
                        numberOfChildren: searchParams.childCount,
                        numberOfInfantsInLap: infantCount.infantinLapCount,
                        numberOfInfantsInSeat: infantCount.infantinSeatCount
                    },
                    data: {
                        searchParameters: {
                            departureAirportCode: searchParams.departure.airport.substring(depairportStringlength - 4, depairportStringlength - 1),
                            arrivalAirportCode: searchParams.arrival.airport.substring(arrairportStringlength - 4, arrairportStringlength - 1),
                            departureDateTime: new Date(searchParams.departure.date).toISOString(),
                            arrivalDateTime: (searchParams.routeType === "ONE_WAY") ? undefined : new Date(searchParams.arrival.date).toISOString()
                        },
                        offerlist: self.getOffersDataForEPCLogging(uiModel.viewableOffers)
                    },
                    utctimestamp: Date.now()
                });

                return logData;
            },

            log: function(logData) {
                if (logData !== undefined && !$.isPlainObject(logData)) {
                    console.log('Invalid parameter passed to logImpressionData(); parameter must be an object.');
                    console.dir(logData);
                    return;
                }

                logData = self.populateLogData(logData);
                logData.context.tests = self.tests;
                logData.data.promotionId = self.promotionId;
                //calls impressions.log
                var host = window.location.host;
                if(host.indexOf("trunk") !== -1){
                    logUrl = "https://wwwexpediacom.integration.sb.karmalab.net"+logUrl;
                }
                impressions = new Impressions(logUrl);
                impressions.log(logData, function(xhr, error) {
                    if (error !== undefined) {
                        self.logErrorWithXHR('Failed to post impression data to collector web', error, xhr, ['origin=impressionDataForAnalytics.log']);
                    }
                });

            },

            logErrorWithXHR: function (errorLabel, error, XHR, debugInfo) {
                debugInfo = debugInfo||[];

                // Fail fast if the caller hasn't provided the right information
                if (!errorLabel || !error ||!XHR || !$.isArray(debugInfo)) {
                    return;
                }

                if(window.skellyContext){
                    debugInfo.push("isSkelly=true");
                }
                //http status code and response
                debugInfo.push("onError xhr status="+XHR.status);
                debugInfo.push("onError xhr response text="+XHR.responseText);

                // Information about the environment
                debugInfo.push("pageUrl=" + encodeURIComponent(window.location.href));
                debugInfo.push("clientWidth=" + document.documentElement.clientWidth);

                dctk.logging.logError(errorLabel, error, debugInfo);

                if (window.console && typeof window.console.error === 'function') {
                    window.console.error(error.stack);
                }
            }


        };

    $(function() {
        var eventBus = $.extend({}, Backbone.Events);
        eventBus.listenTo(uiModel.viewableOffers, 'reset', function() {
            try {
                impressionDataForAnalytics.getExperimentInfo().pipe(impressionDataForAnalytics.log);
            }catch(err){
                dctk.logging.logError('Impression logging failed', err, ['origin=impressionDataForAnalytics.log'])
            }
        });
    });

    return impressionDataForAnalytics;
});

require(['configuration'], function(configuration) {
    'use strict';

    if (configuration.isImpressionLoggingEnabled) {
        require(['impressionDataForAnalytics']);
    }


});
/* static_content/default/default/scripts/shared/Impressions.js */
/*jslint browser: true, single: true, this: true */
/*global window, define */

define('Impressions', ['jquery'], function ($) {
    'use strict';

    function Impressions(url) {

        this.url = url;

        this.log = function (logData, callback) {
            $.ajax({
                type: 'POST',
                contentType: 'application/json',
                url: this.url,
                data: window.JSON.stringify(logData)
            }).done(function (data, textStatus, jqXHR) {
                if (typeof callback === 'function') {
                    return callback(jqXHR);
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                if (typeof callback === 'function') {
                    return callback(jqXHR, errorThrown);
                }
            });
        };
    }

    return Impressions;

});
/* static_content/default/default/scripts/exp/flights/flux/wizardUrlBuilder.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

define('wizardUrlBuilder', ['underscore', 'FluxSearchDeeplinkGenerator', 'experiments'], function(_, fluxSearchDeeplinkGenerator, experiments) {
    'use strict';

    var buildLegSearchInfo = function(model) {
            var legSearchInfoList = [],
                legSearchInfoObject = {},
                tripList = model.get('trips'),
                departure,
                arrival,
                routeType = model.get('routeType'),
                departureAirport,
                arrivalAirport,
                departureDate,
                arrivalDate,
                onValidDepartureAndArrival,
                onValidTrip;

            tripList.each(function(trip){

                departure = trip.get('departure');
                arrival = trip.get('arrival');

                onValidDepartureAndArrival = ((departure !== undefined && departure !== '' )
                                             && (arrival !== undefined && arrival != ''));

                if(onValidDepartureAndArrival) {

                    departureAirport = departure.get('airport');
                    arrivalAirport = arrival.get('airport');
                    departureDate = departure.get('date').get('shortFormat');
                    arrivalDate = arrival.get('date').get('shortFormat');

                    onValidTrip = ((departureAirport !== undefined && departureAirport !== '')
                        && (arrivalAirport !== undefined && arrivalAirport !== '')
                        && (departureDate !== undefined && departureDate !== ''));

                    if(onValidTrip) {

                        legSearchInfoObject = {
                            departureLocation : departureAirport,
                            arrivalLocation : arrivalAirport,
                            departureDate: departureDate
                        };

                        if(routeType === 'ROUND_TRIP') {
                            if(arrivalDate !== undefined && arrivalDate !== '') {

                                legSearchInfoObject.arrivalDate = arrivalDate;
                            }
                        }
                        legSearchInfoList.push(legSearchInfoObject);
                    }
                }
            });

            if(routeType === 'ONE_WAY' || routeType === 'ROUND_TRIP') {

                return legSearchInfoList.slice(0, 1);
            }
            return legSearchInfoList;

        },

        buildTravelerCategoryInfo = function(model) {
            var travelerCategoryInfo,
                childAgeList,
                travelerPreferences = model.get('travelerPreferences'),
                age;

            travelerCategoryInfo = {
                adultCount: travelerPreferences.get('numberOfAdults'),
                seniorCount: travelerPreferences.get('seniorCount'),
                childCount: travelerPreferences.get('numberOfChildren'),
                totalPassengers: travelerPreferences.get('totalPassengers'),
                infantSeatingOnLap: travelerPreferences.get('infantsInLap')? true: false,
                childAges: []
            };

            childAgeList = travelerPreferences.get('childAges');

            if(travelerCategoryInfo.childCount > 0) {
                childAgeList.each(function(childAge){
                    age = childAge.get('age');
                    if(age !== -1) {
                        travelerCategoryInfo.childAges.push(age);
                    }
                });
            }

            return travelerCategoryInfo;
        },

        buildCabinClass = function(model) {
            var seatingClass = model.get('travelerPreferences').get('seatingClass');

            switch(seatingClass) {
                case '5': return 'premium';
                case '3': return 'economy';
                case '2': return 'business';
                case '1': return 'first';
                default: return '';
            }
        },

        buildSearchParameters = function(model){
            var travelerPreferences = model.get('travelerPreferences');

            return {
                flightRouteType: model.get('routeType'),
                legSearchInfoList: buildLegSearchInfo(model),
                travelerCategoryInfo: buildTravelerCategoryInfo(model),
                airlinePreferenceCode: travelerPreferences.get('preferredAirline'),
                airlineList: travelerPreferences.get('airlines'),
                flightAirCabinClass: buildCabinClass(model),
                nonstopOnly: travelerPreferences.get('nonstopOnly'),
                refundableFlightsOnly: travelerPreferences.get('refundableOnly'),
                passengerCount: travelerPreferences.get('totalPassengers'),
                flightPackageType: model.get('packageType'),
                driverAge: model.get('driverAge')
            };
        },

        generateUrl = function(model) {
            var searchParameters = buildSearchParameters(model),
                deepLink = fluxSearchDeeplinkGenerator.generateDeeplink(searchParameters),
                origRef = '&origref=' + encodeURIComponent(model.get('origRef'));

			if (experiments.getVariant(12068) === 1
					&& window.location.hash !== ''
					&& model.get('changeDepartDate') === undefined
					&& model.get('changeReturnDate') === true){
            	return deepLink + origRef + window.location.hash;
            }
            return deepLink + origRef;
        };

    return { generateUrl: generateUrl, buildSearchParameters: buildSearchParameters };
});
/* static_content/default/default/scripts/exp/flights/flux/FluxSearchDeeplinkGenerator.js */
/*jslint nomen: true */
/*global require, define, console */

define('FluxSearchDeeplinkGenerator', ['underscore'], function (_) {
    'use strict';

    function getPreferredAirline(searchParameters) {
        var preferredAirline =  searchParameters.airlinePreferenceCode;

        return preferredAirline !== '' ? preferredAirline : false;
    }

    function getPreferredClass(searchParameters) {
        var preferredClass = searchParameters.flightAirCabinClass;

        return preferredClass !== 'COACH' ? preferredClass : false;
    }

    function getStopPreference(searchParameters) {
        var stopPreference = searchParameters.nonstopOnly;

        return stopPreference ? '0' : false;
    }

    function getPenaltyPreference(searchParameters) {
        var penaltyPreference = searchParameters.refundableFlightsOnly;

        return penaltyPreference ? 'Y' : false;
    }

    function getAdultCount(searchParameters) {
        var adultCount = searchParameters.travelerCategoryInfo.adultCount;

        return adultCount;
    }

    function getChildInfo(searchParameters) {
        var childCount = searchParameters.travelerCategoryInfo.childCount,
            childAges = _.filter(searchParameters.travelerCategoryInfo.childAges, function (age) {
                return age !== -1;
            }).join(';');

        return childCount > 0 ? childCount + '[' + childAges + ']' : childCount;
    }

    function getSeniorCount(searchParameters) {
        var seniorCount = searchParameters.travelerCategoryInfo.seniorCount;

        return seniorCount;
    }

    function getInfantInfo(searchParameters) {
        var infantInfo = searchParameters.travelerCategoryInfo.infantSeatingOnLap;

        return infantInfo ? 'Y' : 'N';
    }

    var packageType = {
            FLIGHT_ONLY: 'f',
            FLIGHT_CAR: 'fc'
        },
        optionsParamToFunctionMap= {
            'carrier%3A': getPreferredAirline,
            'cabinclass%3A': getPreferredClass,
            'maxhops%3A': getStopPreference,
            'nopenalty%3A' : getPenaltyPreference
        },
        passengerParamToFunctionMap = {
            'adults:' : getAdultCount,
            'children:' : getChildInfo,
            'seniors:' : getSeniorCount,
            'infantinlap:' : getInfantInfo
        },
        FluxSearchDeeplinkGenerator = {
            packageType: packageType,
            generateDeeplink: function (searchParameters) {
                var generateOptions = function () {
                    var options = _.chain(optionsParamToFunctionMap)
                        .map(function (funct, urlParam) {
                            var result = funct(searchParameters);
                            return result ? urlParam + funct(searchParameters) : false;
                        })
                        .filter(function (param) { return param; })
                        .value()
                        .join('%2C');
                    return options ? '&options=' + options : '';
                };
                var generatePassengers = function () {
                    var passengers = _.chain(passengerParamToFunctionMap)
                        .map(function (funct, urlParam){ return urlParam + funct(searchParameters); })
                        .filter(function (param) { return param; })
                        .value()
                        .join(',');
                    return "&passengers=" + passengers;
                };
                var generateRoundtripLegs = function () {
                    var legString = generateSingleLegs(),
                        leg = searchParameters.legSearchInfoList[0];

                    legString +=
                        '&leg2=' +
                            'from:' + leg.arrivalLocation + ',' +
                            'to:' + leg.departureLocation + ',' +
                            'departure:' + leg.arrivalDate +
                            'TANYT';
                    return legString;
                };
                var generateSingleLegs = function () {
                    var legString = '';
                    _.each(searchParameters.legSearchInfoList, function (leg, index) {
                        legString +=
                            '&leg' + (index + 1) + '=' +
                            'from:' + leg.departureLocation + ',' +
                            'to:' + leg.arrivalLocation + ',' +
                            'departure:' + leg.departureDate +
                            'TANYT';
                    });
                    return legString;
                };
                var generateLegs = searchParameters.flightRouteType === 'ROUND_TRIP' ? generateRoundtripLegs : generateSingleLegs;
                var generateTripType = function () {
                    var tripType = searchParameters.flightRouteType;
                    return 'trip=' + {
                        'MULTIPLE_DESTINATION' : 'multi',
                        'ROUND_TRIP' : 'roundtrip',
                        'ONE_WAY' : 'oneway'
                    }[tripType];
                };
                var generateBaseSearchType = function () {
                    if(packageType.FLIGHT_ONLY === searchParameters.flightPackageType) {
                        return '/Flights-Search?';
                    }

                    return '/flexibleshopping?packageType=' + searchParameters.flightPackageType + '&';
                };
                var generateShopMode = function () {
                    if(packageType.FLIGHT_ONLY === searchParameters.flightPackageType) {
                        return '';
                    }

                    return '&shopMode=' + searchParameters.flightPackageType;
                };
                var generateDriverAge = function () {
                    return searchParameters.driverAge ? '&driverAge=' + searchParameters.driverAge : '';
                }
                return generateBaseSearchType() + generateTripType() + generateLegs() + generatePassengers() + generateOptions() + generateDriverAge() + '&mode=search' + generateShopMode();
            }
        };

    return FluxSearchDeeplinkGenerator;
});
/* bundle-assets/flights/baseline/script/seatAmenities/SeatAmenitiesView.js */
/*jslint browser: true, unparam: true, white: true, todo: true, nomen: true */
/*global define, require, console */

define('seatAmenitiesView', ['flights', 'jquery', 'handlebars','backbone', 'analytics', 'uitk'], function(flights, $, handlebars, Backbone, analytics, uitk) {
    'use strict';

    function fireOmniture(topic, $tooltip, event) {
        if (-1 !== $tooltip.data('tooltip-id').indexOf('amenity-tooltip')) {
            var amenityTags = '';

            if ($tooltip.find('.amenity-wifi').length !== 0) {
                amenityTags += '.Wifi'
            }
            if ($tooltip.find('.amenity-entertainment').length !== 0) {
                amenityTags += '.Entertainment'
            }
            if ($tooltip.find('.amenity-power').length !== 0) {
                amenityTags += '.Power'
            }

            analytics.trackAction('FLT.SR.Listings.Amenities' + amenityTags + '.Tooltip', $(event.target));
        }

        $tooltip.uitk_tooltip('show');
    }

    function amenitiesNotSupported(amenities) {
        return (0 === amenities.wifiCount &&
                0 === amenities.entertainmentCount &&
                0 === amenities.powerCount);
    }

    return Backbone.View.extend({
        initialize: function(options) {
            this.getOfferElement = options && typeof options.getOfferElement === 'function'? options.getOfferElement : undefined;
            uitk.subscribe('tooltip.beforeOpen', fireOmniture);
            this.templates = {
                seatAmenitiesTooltip: handlebars.templates.SeatAmenitiesTooltip,
                seatAmenitiesLink: handlebars.templates.SeatAmenitiesLink
            };
        },
        render: function(collection) {
            var self = this;

            collection.each(function (model, index) {
                var $amenityContainer = self.getAmenitiesElement(model.id),
                    amenityData = model.get('legs').at(0).get('amenities'),
                    tooltipMarkup;

                if (0 === $amenityContainer.length || amenitiesNotSupported(amenityData)) {
                    return;
                }

                amenityData.linkMarkup = self.templates.seatAmenitiesLink(amenityData);
                amenityData.contentId = 'amenity-content-' + index;
                amenityData.tooltipId = 'amenity-tooltip-' + index;
                tooltipMarkup = self.templates.seatAmenitiesTooltip(amenityData);

                $amenityContainer.parent().removeClass('hide');
                $amenityContainer.html(tooltipMarkup);
            });
        },

        getAmenitiesElement: function (offerId) {
            if (!this.getOfferElement) {
                flights.log('getOfferElement has not been defined');
                return;
            }

            return this.getOfferElement(offerId).find('.amenity-icons');
        }

    });
});
/* static_content/default/default/scripts/TealeafSDK.js */
/*
 * Licensed Materials - Property of IBM
 * ? Copyright IBM Corp. 2013
 * US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 *
 * @version 2.1.0.856
 * @flags w3c,NDEBUG
 */
var TLT=(function(){function logScreenview(type,name,referrerName,root){var screenviewMsg=null,queue=TLT.getService("queue"),replay=TLT.getModule("replay"),webEvent=null;if(!name||typeof name!=="string"){return}if(!referrerName||typeof referrerName!=="string"){referrerName=""}screenviewMsg={type:2,screenview:{type:type,name:name,url:window.location.pathname,referrer:referrerName}};if(type==="LOAD"){if(replay){webEvent={type:"screenview_load"};replay.onevent(webEvent)}}if(type==="LOAD"||type==="UNLOAD"){queue.post("",screenviewMsg,"DEFAULT")}}var tltStartTime=(new Date()).getTime(),modules={},services={},initialized=false,state=null,jscriptVersionIE=(function(){var _scriptVersionIE=0;
/*@cc_on
            _scriptVersionIE = @_jscript_version;
            @*/
return _scriptVersionIE}()),legacyIE=(function(){var _legacyIE=false;
/*@cc_on
            _legacyIE = @_jscript_version < 9 || (window.performance && document.documentMode < 9);
            @*/
return _legacyIE}()),isFrameBlacklisted=(function(){var blacklistedFrames,checkedFrames=[];function prepareBlacklistedFrames(scope){var browserService=core.getService("browser"),blacklist=core.getCoreConfig().framesBlacklist,foundFrame,i;blacklistedFrames=blacklistedFrames||[];scope=scope||null;if(typeof blacklist!=="undefined"&&blacklist.length>0){for(i=0;i<blacklist.length;i+=1){foundFrame=browserService.query(blacklist[i],scope);if(foundFrame){blacklistedFrames.push(foundFrame)}}checkedFrames=checkedFrames.concat(browserService.queryAll("iframe",scope))}}function isFrameBlacklisted(iframe){if(core.utils.indexOf(checkedFrames,iframe)<0){prepareBlacklistedFrames(iframe.ownerDocument)}return core.utils.indexOf(blacklistedFrames,iframe)>-1}isFrameBlacklisted.clearCache=function(){blacklistedFrames=null};return isFrameBlacklisted}()),lastClickedElement=null,servicePassthroughs={config:["getConfig","updateConfig","getCoreConfig","updateCoreConfig","getModuleConfig","updateModuleConfig","getServiceConfig","updateServiceConfig"],queue:["post","setAutoFlush","flushAll"],browserBase:["processDOMEvent"]},loadUnloadHandler=(function(){var status={};return{normalizeModuleEvents:function(moduleName,moduleEvents){var load=false,unload=false,browserService=core.getService("browser");status[moduleName]={loadFired:false,pageHideFired:false};core.utils.forEach(moduleEvents,function(eventConfig){switch(eventConfig.name){case"load":load=true;moduleEvents.push(core.utils.mixin(core.utils.mixin({},eventConfig),{name:"pageshow"}));break;case"unload":unload=true;moduleEvents.push(core.utils.mixin(core.utils.mixin({},eventConfig),{name:"pagehide"}));moduleEvents.push(core.utils.mixin(core.utils.mixin({},eventConfig),{name:"beforeunload"}));break;case"change":if(legacyIE&&browserService.getServiceName()==="W3C"){moduleEvents.push(core.utils.mixin(core.utils.mixin({},eventConfig),{name:"propertychange"}))}break}});if(!load&&!unload){delete status[moduleName];return}status[moduleName].silentLoad=!load;status[moduleName].silentUnload=!unload;if(!load){moduleEvents.push({name:"load",target:window.window})}if(!unload){moduleEvents.push({name:"unload",target:window.window})}},canPublish:function(moduleName,event){var mod;if(status.hasOwnProperty(moduleName)===false){return true}mod=status[moduleName];switch(event.type){case"load":mod.pageHideFired=false;mod.loadFired=true;return !mod.silentLoad;case"pageshow":mod.pageHideFired=false;event.type="load";return !mod.loadFired&&!mod.silentLoad;case"pagehide":event.type="unload";mod.loadFired=false;mod.pageHideFired=true;return !mod.silentUnload;case"unload":case"beforeunload":event.type="unload";mod.loadFired=false;return !mod.pageHideFired&&!mod.silentUnload}return true},isUnload:function(event){return typeof event==="object"?(event.type==="unload"||event.type==="beforeunload"||event.type==="pagehide"):false}}}()),events={},_init=function(){},_callback=null,okToCallInit=true,_lastTouch=null,_hasScroll=false,_sendScroll=false,_isApple=navigator.userAgent.indexOf("iPhone")>-1||navigator.userAgent.indexOf("iPod")>-1||navigator.userAgent.indexOf("iPad")>-1,core={getStartTime:function(){return tltStartTime},init:function(config,callback){var timeoutCallback;_callback=callback;if(!okToCallInit){throw"init must only be called once!"}okToCallInit=false;timeoutCallback=function(event){event=event||window.event||{};if(document.addEventListener||event.type==="load"||document.readyState==="complete"){if(document.removeEventListener){document.removeEventListener("DOMContentLoaded",timeoutCallback,false);window.removeEventListener("load",timeoutCallback,false)}else{document.detachEvent("onreadystatechange",timeoutCallback);window.detachEvent("onload",timeoutCallback)}_init(config,callback)}};if(document.readyState==="complete"){setTimeout(timeoutCallback)}else{if(document.addEventListener){document.addEventListener("DOMContentLoaded",timeoutCallback,false);window.addEventListener("load",timeoutCallback,false)}else{document.attachEvent("onreadystatechange",timeoutCallback);window.attachEvent("onload",timeoutCallback)}}},isInitialized:function(){return initialized},getState:function(){return state},destroy:function(skipEvents){var token="",eventName="",target=null,serviceName=null,service=null,browser=null;if(okToCallInit){return false}this.stopAll();if(!skipEvents){browser=this.getService("browser");for(token in events){if(events.hasOwnProperty(token)&&browser!==null){eventName=token.split("|")[0];target=events[token].target;browser.unsubscribe(eventName,target,this._publishEvent)}}}for(serviceName in services){if(services.hasOwnProperty(serviceName)){service=services[serviceName].instance;if(service&&typeof service.destroy==="function"){service.destroy()}services[serviceName].instance=null}}isFrameBlacklisted.clearCache();events={};initialized=false;okToCallInit=true;state="destroyed";if(typeof _callback==="function"){try{_callback("destroyed")}catch(e){}}},_updateModules:function(scope){var config=this.getCoreConfig(),browser=this.getService("browser"),moduleConfig=null,moduleName=null;if(config&&browser&&config.modules){try{for(moduleName in config.modules){if(config.modules.hasOwnProperty(moduleName)){moduleConfig=config.modules[moduleName];if(modules.hasOwnProperty(moduleName)){if(moduleConfig.enabled===false){this.stop(moduleName)}else{this.start(moduleName)}if(moduleConfig.events&&browser!==null){this._registerModuleEvents(moduleName,moduleConfig.events,scope)}}else{if(browser.loadScript){browser.loadScript(config.moduleBase+moduleName+".js")}}}}this._registerModuleEvents.clearCache()}catch(e){core.destroy();return false}}else{return false}return true},rebind:function(scope){core._updateModules(scope)},getSessionData:function(){var rv=null,sessionData=null,scName,scValue,config=core.getCoreConfig();if(!config||!config.sessionDataEnabled){return null}sessionData=config.sessionData||{};scName=sessionData.sessionQueryName;if(scName){scValue=core.utils.getQueryStringValue(scName,sessionData.sessionQueryDelim)}else{scName=sessionData.sessionCookieName||"TLTSID";scValue=core.utils.getCookieValue(scName)}if(scName&&scValue){rv=rv||{};rv.tltSCN=scName;rv.tltSCV=scValue;rv.tltSCVNeedsHashing=!!sessionData.sessionValueNeedsHashing}return rv},logCustomEvent:function(name,customMsgObj){var customMsg=null,queue=this.getService("queue");if(!name||typeof name!=="string"){name="CUSTOM"}customMsgObj=customMsgObj||{};customMsg={type:5,customEvent:{name:name,data:customMsgObj}};queue.post("",customMsg,"DEFAULT")},logExceptionEvent:function(msg,url,line){var exceptionMsg=null,queue=this.getService("queue");if(!msg||typeof msg!=="string"){return}url=url||"";line=line||"";exceptionMsg={type:6,exception:{description:msg,url:url,line:line}};queue.post("",exceptionMsg,"DEFAULT")},logScreenviewLoad:function(name,referrerName,root){logScreenview("LOAD",name,referrerName,root)},logScreenviewUnload:function(name){logScreenview("UNLOAD",name)},_hasSameOrigin:function(iframe){try{return iframe.document.location.host===document.location.host&&iframe.document.location.protocol===document.location.protocol}catch(e){}return false},_registerModuleEvents:(function(){var idCache;function _registerModuleEventsOnScope(moduleName,moduleEvents,scope){var browserBase=core.getService("browserBase"),browser=core.getService("browser"),documentScope=core.utils.getDocument(scope),isFrame=core.utils.isIFrameDescendant(scope);scope=scope||documentScope;loadUnloadHandler.normalizeModuleEvents(moduleName,moduleEvents);core.utils.forEach(moduleEvents,function(eventConfig){var target=eventConfig.target||documentScope,token="";if(eventConfig.recurseFrames!==true&&isFrame){return}if(typeof target==="string"){core.utils.forEach(browser.queryAll(target,scope),function(element){var idData=idCache.get(element);if(!idData){idData=browserBase.ElementData.prototype.examineID(element);idCache.set(element,idData)}token=eventConfig.name+"|"+idData.id+idData.type;if(core.utils.indexOf(events[token],moduleName)!==-1){return}events[token]=events[token]||[];events[token].push(moduleName);events[token].target=element;browser.subscribe(eventConfig.name,element,core._publishEvent)})}else{token=core._buildToken4bubbleTarget(eventConfig.name,target,typeof eventConfig.target==="undefined");if(!events.hasOwnProperty(token)){events[token]=[moduleName];browser.subscribe(eventConfig.name,target,core._publishEvent)}else{if(core.utils.indexOf(events[token],moduleName)===-1){events[token].push(moduleName)}}}if(token!==""){if(typeof target!=="string"){events[token].target=target}}})}function _isFrameLoaded(hIFrame){return hIFrame.contentWindow&&core._hasSameOrigin(hIFrame.contentWindow)&&hIFrame.contentWindow.document&&hIFrame.contentWindow.document.readyState==="complete"}function registerModuleEvents(moduleName,moduleEvents,scope){scope=scope||core._getLocalTop().document;idCache=idCache||new core.utils.WeakMap();_registerModuleEventsOnScope(moduleName,moduleEvents,scope);if(moduleName!=="performance"){var hIFrame=null,cIFrames=scope.getElementsByTagName("iframe"),i,iLength;for(i=0,iLength=cIFrames.length;i<iLength;i+=1){hIFrame=cIFrames[i];if(isFrameBlacklisted(hIFrame)){continue}if(_isFrameLoaded(hIFrame)){core._registerModuleEvents(moduleName,moduleEvents,hIFrame.contentWindow.document)}else{(function(moduleName,moduleEvents,hIFrame){var _iframeContext={moduleName:moduleName,moduleEvents:moduleEvents,hIFrame:hIFrame,_registerModuleEventsDelayed:function(){if(!isFrameBlacklisted(hIFrame)&&core._hasSameOrigin(hIFrame.contentWindow)){core._registerModuleEvents(moduleName,moduleEvents,hIFrame.contentWindow.document)}}};core.utils.addEventListener(hIFrame,"load",function(){_iframeContext._registerModuleEventsDelayed()})}(moduleName,moduleEvents,hIFrame))}}}}registerModuleEvents.clearCache=function(){if(idCache){idCache.clear();idCache=null}};return registerModuleEvents}()),_buildToken4currentTarget:function(event){var target=event.nativeEvent.currentTarget,idData=this.getService("browserBase").ElementData.prototype.examineID(target);return event.type+"|"+idData.id+idData.type},_buildToken4bubbleTarget:function(eventType,target,checkIframe){var localTop=core._getLocalTop(),_getIframeElement=function(documentScope){var retVal=null;if(core._hasSameOrigin(localWindow.parent)){core.utils.forEach(localWindow.parent.document.getElementsByTagName("iframe"),function(iframe){if(!isFrameBlacklisted(iframe)&&core._hasSameOrigin(iframe.contentWindow)&&iframe.contentWindow.document===documentScope){retVal=iframe}})}return retVal},documentScope=core.utils.getDocument(target),localWindow,browserBase=this.getService("browserBase"),iframeElement=null,tmpTarget,retVal=eventType;if(documentScope){localWindow=documentScope.defaultView||documentScope.parentWindow}if(target===window||target===window.window){retVal+="|null-2|window"}else{if(checkIframe&&localWindow&&core._hasSameOrigin(localWindow.parent)&&typeof documentScope!=="undefined"&&localTop.document!==documentScope){iframeElement=_getIframeElement(documentScope);if(iframeElement){tmpTarget=browserBase.ElementData.prototype.examineID(iframeElement);retVal+="|"+tmpTarget.xPath+"-2"}}else{retVal+="|null-2|document"}}return retVal},_reinitConfig:function(){core._updateModules()},_handleTouchStart:function(event){var i,j;if(_isApple){return false}if(_lastTouch===null){_lastTouch=event;return true}for(i=0;i<_lastTouch.nativeEvent.touches.length;i+=1){for(j=0;j<event.nativeEvent.touches.length;j+=1){if(_lastTouch.nativeEvent.touches[i]===event.nativeEvent.touches[j]){return true}}}core._prepNonIosTouchEnd();_lastTouch=event;return true},_handleTouchMove:function(event){if(_isApple){return}_lastTouch=event},_handleTouchScroll:function(event){if(_isApple){return false}if(_lastTouch!==null&&event.type==="scroll"){_lastTouch.target.position.x=event.target.position.x;_lastTouch.target.position.y=event.target.position.y;_hasScroll=true}return true},_prepNonIosTouchEnd:function(){var hasBeenPublished=false;if(_lastTouch!==null){_lastTouch.type="touchend";_lastTouch.nativeEvent.type="touchend";core._publishEvent(_lastTouch);if(_hasScroll){_lastTouch.type="scroll";_lastTouch.nativeEvent.type="scroll";_sendScroll=true;core._publishEvent(_lastTouch)}hasBeenPublished=true}_lastTouch=null;_hasScroll=false;_sendScroll=false;return hasBeenPublished},_publishEvent:function(event){var moduleName=null,module=null,token=event.type+"|"+event.target.id+event.target.idType,modules=null,i,len,target,modEvent=null,canIgnore=false,canPublish=false,browserService=core.getService("browser");if((event.type==="load"||event.type==="pageshow")&&!event.nativeEvent.customLoad){return}if(_isApple&&(event.type==="touchstart"||event.type==="touchmove")){return}if(_lastTouch!==null&&event.type!=="touchstart"&&event.type!=="touchmove"&&event.type!=="scroll"&&event.type!=="touchend"){core._prepNonIosTouchEnd()}else{if(event.type==="touchstart"){core._handleTouchStart(event);return}else{if(event.type==="touchmove"){core._handleTouchMove(event);return}else{if(_lastTouch!==null&&event.type==="scroll"&&!_sendScroll){core._handleTouchScroll(event);return}else{if(_hasScroll){token="scroll|null-2|window"}}}}}if(jscriptVersionIE>0){if(event.type==="click"){lastClickedElement=event.target.element}if(event.type==="beforeunload"){canIgnore=false;core.utils.forEach(core.getCoreConfig().ieExcludedLinks,function(selector){var i,len,el=browserService.queryAll(selector);for(i=0,len=el?el.length:0;i<len;i+=1){if(typeof el[i]!==undefined&&el[i]===lastClickedElement){canIgnore=true;return}}});if(canIgnore){return}}}if(loadUnloadHandler.isUnload(event)){state="unloading"}if(event.type==="change"&&legacyIE&&browserService.getServiceName()==="W3C"&&(event.target.element.type==="checkbox"||event.target.element.type==="radio")){return}if(event.type==="propertychange"){if(event.nativeEvent.propertyName==="checked"&&(event.target.element.type==="checkbox"||(event.target.element.type==="radio"&&event.target.element.checked))){event.type=event.target.type="change"}else{return}}if(!events.hasOwnProperty(token)&&event.nativeEvent&&event.nativeEvent.currentTarget){token=core._buildToken4currentTarget(event)}if(!events.hasOwnProperty(token)){if(event.hasOwnProperty("nativeEvent")){target=event.nativeEvent.currentTarget||event.nativeEvent.target}token=core._buildToken4bubbleTarget(event.type,target,true)}if(events.hasOwnProperty(token)){modules=events[token];for(i=0,len=modules.length;i<len;i+=1){moduleName=modules[i];module=core.getModule(moduleName);modEvent=core.utils.mixin({},event);if(module&&core.isStarted(moduleName)&&typeof module.onevent==="function"){canPublish=loadUnloadHandler.canPublish(moduleName,modEvent);if(canPublish){module.onevent(modEvent)}}}}if(modEvent&&modEvent.type==="unload"&&canPublish){TLT.destroy()}},_getLocalTop:function(){return window.window},addModule:function(moduleName,creator){modules[moduleName]={creator:creator,instance:null,context:null,messages:[]};if(this.isInitialized()){this.start(moduleName)}},getModule:function(moduleName){if(modules[moduleName]&&modules[moduleName].instance){return modules[moduleName].instance}return null},removeModule:function(moduleName){this.stop(moduleName);delete modules[moduleName]},isStarted:function(moduleName){return modules.hasOwnProperty(moduleName)&&modules[moduleName].instance!==null},start:function(moduleName){var moduleData=modules[moduleName],instance=null;if(moduleData&&moduleData.instance===null){moduleData.context=new TLT.ModuleContext(moduleName,this);instance=moduleData.instance=moduleData.creator(moduleData.context);if(typeof instance.init==="function"){instance.init()}}},startAll:function(){var moduleName=null;for(moduleName in modules){if(modules.hasOwnProperty(moduleName)){this.start(moduleName)}}},stop:function(moduleName){var moduleData=modules[moduleName],instance=null;if(moduleData&&moduleData.instance!==null){instance=moduleData.instance;if(typeof instance.destroy==="function"){instance.destroy()}moduleData.instance=moduleData.context=null}},stopAll:function(){var moduleName=null;for(moduleName in modules){if(modules.hasOwnProperty(moduleName)){this.stop(moduleName)}}},addService:function(serviceName,creator){services[serviceName]={creator:creator,instance:null}},getService:function(serviceName){if(services.hasOwnProperty(serviceName)){if(!services[serviceName].instance){try{services[serviceName].instance=services[serviceName].creator(this);if(typeof services[serviceName].instance.init==="function"){services[serviceName].instance.init()}}catch(e){return null}if(typeof services[serviceName].instance.getServiceName!=="function"){services[serviceName].instance.getServiceName=function(){return serviceName}}}return services[serviceName].instance}return null},removeService:function(serviceName){delete services[serviceName]},broadcast:function(message){var i=0,len=0,prop=null,module=null;if(message&&typeof message==="object"){for(prop in modules){if(modules.hasOwnProperty(prop)){module=modules[prop];if(core.utils.indexOf(module.messages,message.type)>-1){if(typeof module.instance.onmessage==="function"){module.instance.onmessage(message)}}}}}},listen:function(moduleName,messageType){var module=null;if(this.isStarted(moduleName)){module=modules[moduleName];if(core.utils.indexOf(module.messages,messageType)===-1){module.messages.push(messageType)}}},fail:function(message,failcode,skipEvents){message="UIC FAILED. "+message;try{core.destroy(!!skipEvents)}finally{core.utils.clog(message);throw new core.UICError(message,failcode)}},UICError:(function(){function UICError(message,errorCode){this.message=message;this.code=errorCode}UICError.prototype=new Error();UICError.prototype.name="UICError";UICError.prototype.constructor=UICError;return UICError}())};_init=function(config,callback){var configService,event,webEvent,baseBrowser,browserService;if(initialized){core.utils.clog("TLT.init() called more than once. Ignoring.");return}configService=core.getService("config");configService.updateConfig(config);if(!core._updateModules()){if(state!=="destroyed"){core.destroy()}return}if(configService.subscribe){configService.subscribe("configupdated",core._reinitConfig)}initialized=true;state="loaded";event={type:"load",target:window.window,srcElement:window.window,currentTarget:window.window,bubbles:true,cancelBubble:false,cancelable:true,timeStamp:+new Date(),customLoad:true};baseBrowser=core.getService("browserBase");webEvent=new baseBrowser.WebEvent(event);core._publishEvent(webEvent);if(typeof _callback==="function"){try{_callback("initialized")}catch(e){}}};(function(){var name=null,i,len;for(name in servicePassthroughs){if(servicePassthroughs.hasOwnProperty(name)){for(i=0,len=servicePassthroughs[name].length;i<len;i+=1){(function(serviceName,methodName){core[methodName]=function(){var service=this.getService(serviceName);if(service){return service[methodName].apply(service,arguments)}}}(name,servicePassthroughs[name][i]))}}}}());return core}());(function(){var a={indexOf:function(e,d){var c,b;if(e&&e instanceof Array){for(c=0,b=e.length;c<b;c+=1){if(e[c]===d){return c}}}return -1},forEach:function(f,e,d){var c,b;if(!f||!f.length||!e||!e.call){return}for(c=0,b=f.length;c<b;c+=1){e.call(d,f[c],c,f)}},some:function(f,e){var c,b,d=false;for(c=0,b=f.length;c<b;c+=1){d=e(f[c],c,f);if(d){return d}}return d},convertToArray:function(d){var e=0,c=d.length,b=[];while(e<c){b.push(d[e]);e+=1}return b},isUndefOrNull:function(b){return typeof b==="undefined"||b===null},mixin:function(f){var e,d,c,b;for(c=1,b=arguments.length;c<b;c+=1){d=arguments[c];for(e in d){if(Object.prototype.hasOwnProperty.call(d,e)){f[e]=d[e]}}}return f},extend:function(b,c,d){var e="";for(e in d){if(Object.prototype.hasOwnProperty.call(d,e)){if(b&&Object.prototype.toString.call(d[e])==="[object Object]"){if(typeof c[e]==="undefined"){c[e]={}}a.extend(b,c[e],d[e])}else{c[e]=d[e]}}}return c},clone:function(c){var d,b;if(null===c||"object"!==typeof c){return c}if(c instanceof Object){d=(Object.prototype.toString.call(c)==="[object Array]")?[]:{};for(b in c){if(Object.prototype.hasOwnProperty.call(c,b)){d[b]=a.clone(c[b])}}return d}},access:function(g,e){var f=e||window,c,d,b;if(typeof g!=="string"||(typeof f!=="object"&&f!==null)){return}c=g.split(".");for(d=0,b=c.length;d<b;d+=1){if(d===0&&c[d]==="window"){continue}if(!Object.prototype.hasOwnProperty.call(f,c[d])){return}f=f[c[d]];if(d<(b-1)&&!(f instanceof Object)){return}}return f},isNumeric:function(b){return !isNaN(b+1-1)},isUpperCase:function(b){return b===b.toUpperCase()&&b!==b.toLowerCase()},isLowerCase:function(b){return b===b.toLowerCase()&&b!==b.toUpperCase()},getDocument:function(b){if(b.nodeType!==9){return(!a.isUndefOrNull(b.ownerDocument))?(b.ownerDocument):(b.document)}return b},getWindow:function(c){if(c.self!==c){var b=a.getDocument(c);return(!a.isUndefOrNull(b.defaultView))?(b.defaultView):(b.parentWindow)}return c},isIFrameDescendant:function(b){return a.getWindow(b)!=TLT._getLocalTop()},getOrientationMode:function(b){var c="INVALID";if(typeof b!=="number"){return c}switch(b){case 0:case 180:case 360:c="PORTRAIT";break;case 90:case -90:case 270:c="LANDSCAPE";break;default:c="UNKNOWN";break}return c},clog:(function(b){return function(){}}(window)),trim:function(b){if(!b||!b.toString){return b}return b.toString().replace(/^\s+|\s+$/g,"")},ltrim:function(b){if(!b||!b.toString){return b}return b.toString().replace(/^\s+/,"")},rtrim:function(b){if(!b||!b.toString){return b}return b.toString().replace(/\s+$/,"")},getCookieValue:function(j,l){var f,g,d,k,c=null,b;try{l=l||document.cookie;if(!j||!j.toString){return null}j+="=";b=j.length;k=l.split(";");for(f=0,g=k.length;f<g;f+=1){d=k[f];d=a.ltrim(d);if(d.indexOf(j)===0){c=d.substring(b,d.length);break}}}catch(h){}return c},getQueryStringValue:function(g,l,b){var f,d,m,c=null,h;try{b=b||window.location.search;m=b.length;if(!g||!g.toString||!m){return null}l=l||"&";b=l+b.substring(1);g=l+g+"=";f=b.indexOf(g);if(f!==-1){h=f+g.length;d=b.indexOf(l,h);if(d===-1){d=m}c=decodeURIComponent(b.substring(h,d))}}catch(k){}return c},addEventListener:(function(){if(window.addEventListener){return function(c,b,d){c.addEventListener(b,d,false)}}return function(c,b,d){c.attachEvent("on"+b,d)}}()),WeakMap:(function(){function b(f,e){var d,c;f=f||[];for(d=0,c=f.length;d<c;d+=1){if(f[d][0]===e){return d}}return -1}return function(){var c=[];this.set=function(e,f){var d=b(c,e);c[d>-1?d:c.length]=[e,f]};this.get=function(e){var d=c[b(c,e)];return(d?d[1]:undefined)};this.clear=function(){c=[]};this.has=function(d){return(b(c,d)>=0)};this.remove=function(e){var d=b(c,e);if(d>=0){c.splice(d,1)}};this["delete"]=this.remove}}())};if(typeof TLT==="undefined"||!TLT){window.TLT={}}TLT.utils=a}());(function(){TLT.EventTarget=function(){this._handlers={}};TLT.EventTarget.prototype={constructor:TLT.EventTarget,publish:function(c,f){var d=0,a=0,b=this._handlers[c],e={type:c,data:f};if(typeof b!=="undefined"){for(a=b.length;d<a;d+=1){b[d](e)}}},subscribe:function(a,b){if(!this._handlers.hasOwnProperty(a)){this._handlers[a]=[]}this._handlers[a].push(b)},unsubscribe:function(c,e){var d=0,a=0,b=this._handlers[c];if(b){for(a=b.length;d<a;d+=1){if(b[d]===e){b.splice(d,1);return}}}}}}());TLT.ModuleContext=(function(){var a=["broadcast","getConfig:getModuleConfig","listen","post","getStartTime"];return function(f,d){var h={},g=0,b=a.length,j=null,e=null,c=null;for(g=0;g<b;g+=1){j=a[g].split(":");if(j.length>1){c=j[0];e=j[1]}else{c=j[0];e=j[0]}h[c]=(function(i){return function(){var k=d.utils.convertToArray(arguments);k.unshift(f);return d[i].apply(d,k)}}(e))}h.utils=d.utils;return h}}());TLT.addService("config",function(a){function e(g,f){a.utils.extend(true,g,f);d.publish("configupdated",d.getConfig())}var b={core:{},modules:{},services:{}},c=(function(){var f=null,g=null;if(typeof Object.create==="function"){f=Object.create}else{g=function(){};f=function(h){if(typeof h!=="object"&&typeof h!=="function"){throw new TypeError("Object prototype need to be an object!")}g.prototype=h;return new g()}}return f}()),d=a.utils.extend(false,c(new TLT.EventTarget()),{getConfig:function(){return b},updateConfig:function(f){e(b,f)},getCoreConfig:function(){return b.core},updateCoreConfig:function(f){e(b.core,f)},getServiceConfig:function(f){return b.services[f]||null},updateServiceConfig:function(g,f){if(typeof b.services[g]==="undefined"){b.services[g]={}}e(b.services[g],f)},getModuleConfig:function(f){return b.modules[f]||null},updateModuleConfig:function(g,f){if(typeof b.modules[g]==="undefined"){b.modules[g]={}}e(b.modules[g],f)},destroy:function(){b={core:{},modules:{},services:{}}}});return d});TLT.addService("queue",function(n){var h=(function(){var z={};function C(D){return typeof z[D]!=="undefined"}function v(D,E){if(!C(D)){z[D]={data:[],queueId:D,url:E.url,threshold:E.threshold,serializer:E.serializer}}return z[D]}function x(D){if(C(D)){delete z[D]}}function A(D){if(C(D)){return z[D]}return null}function y(E){var D=A(E);if(D!==null){D.data=[]}}function B(D){var E=null;if(C(D)){E=A(D).data;y(D)}return E}function w(G,H){var E=null,D=null,I=window.tlBridge,F=window.iOSJSONShuttle;if((typeof I!=="undefined")&&(typeof I.addMessage==="function")){D=JSON.stringify(H);I.addMessage(D)}else{if((typeof F!=="undefined")&&(typeof F==="function")){D=JSON.stringify(H);F(D)}else{if(C(G)){E=A(G);return E.data.push(H)}}}return 0}return{SEND_HEADER_ONCE:-1,SEND_HEADER_ALWAYS:-2,exists:C,add:v,remove:x,get:A,clear:y,flush:B,push:w}}()),u=null,i=n.getService("browser"),g=n.getService("serializer"),s=n.getService("config"),e=n.getService("message"),l=null,t={},b=true,k=false;function a(){}function j(){return window.location.pathname}function p(w,A){var B=h.flush(w),z=B!==null?B.length:0,v=h.get(w),y={"Content-Type":"application/json","X-Tealeaf":"device (UIC) Lib/2.1.0.856","X-TealeafType":"GUI","X-TeaLeaf-Page-Url":j()},x=v.serializer||"json";B=e.wrapMessages(B);if(z){i.sendRequest({oncomplete:a,url:v.url,async:!A,headers:y,data:g.serialize(B,x)})}}function d(x){var v=null,w=0;for(w=0;w<u.length;w+=1){v=u[w];p(v.qid,x)}return true}function f(v,x){var w=h.push(v,e.createMessage(x));if(w>=h.get(v).threshold&&b&&n.getState()!=="unloading"){p(v)}}function c(x){var w=null,z="",y=0,v=0;for(y=0;y<u.length;y+=1){w=u[y];if(w&&w.modules){for(v=0;v<w.modules.length;v+=1){z=w.modules[v];if(z===x){return w.qid}}}}return l.qid}function q(x,v){t[x]=window.setTimeout(function w(){p(x);t[x]=window.setTimeout(w,v)},v)}function o(v){}function m(w){u=w;var v=null,x;for(x in u){if(u.hasOwnProperty(x)){v=u[x];if(v.qid==="DEFAULT"){l=v}h.add(v.qid,{url:v.endpoint,threshold:v.maxEvents,serializer:v.serializer,timerInterval:v.timerInterval||0});if(typeof v.timerInterval!=="undefined"&&v.timerInterval>0){q(v.qid,v.timerInterval)}}}s.subscribe("configupdated",o);k=true}function r(){if(b){d(true)}s.unsubscribe("configupdated",o);u=null;l=null;k=false}return{init:function(){if(!k){m(s.getServiceConfig("queue")||{})}else{}},destroy:function(){r()},_getQueue:function(v){return h.get(v).data},setAutoFlush:function(v){if(v===1){b=true}else{b=false}},flush:function(v){if(!h.exists(v)){throw new Error("Queue: "+v+" does not exist!")}p(v)},flushAll:function(v){return d(!!v)},post:function(w,x,v){v=v||c(w);if(!h.exists(v)){throw new Error("Queue: "+v+" does not exist!")}f(v,x)}}});TLT.addService("browserBase",function(core){var nonClickableTags={OPTGROUP:true,OPTION:true,NOBR:true},queryDom={},configService=core.getService("config"),serializer,config,blacklist,customid,getXPathFromNode,isInitialized=false;function updateConfig(){configService=core.getService("config");serializer=core.getService("serializer");config=core.getService("config").getServiceConfig("browser")||{};blacklist=config.hasOwnProperty("blacklist")?config.blacklist:[];customid=config.hasOwnProperty("customid")?config.customid:[]}function initBrowserBase(){updateConfig();configService.subscribe("configupdated",updateConfig);isInitialized=true}function destroy(){configService.unsubscribe("configupdated",updateConfig);isInitialized=false}function checkId(node){var i,len,re;if(!node||!node.id||typeof node.id!=="string"){return false}for(i=0,len=blacklist.length;i<len;i+=1){if(typeof blacklist[i]==="string"){if(node.id===blacklist[i]){return false}}else{if(typeof blacklist[i]==="object"){re=new RegExp(blacklist[i].regex,blacklist[i].flags);if(re.test(node.id)){return false}}}}return true}getXPathFromNode=(function(){var specialChildNodes={NOBR:true,P:true};function getXPathArrayFromNode(node){var i,j,idValid=false,nodes_arr=null,parent_window=null,parent_node=null,xpath=[],loop=true;while(loop){loop=false;if(!core.utils.isUndefOrNull(node)){if(!core.utils.isUndefOrNull(node.tagName)){for(i in specialChildNodes){if(specialChildNodes.hasOwnProperty(i)&&node.tagName.toString()===i){node=node.parentNode}}}for(idValid=checkId(node);node!==document&&!idValid;idValid=checkId(node)){parent_node=node.parentNode;if(!parent_node){parent_window=core.utils.getWindow(node);parent_node=(parent_window!==core._getLocalTop())?parent_window.frameElement:document}nodes_arr=parent_node.childNodes;if(!nodes_arr){return xpath}for(i=0,j=0;i<nodes_arr.length;i+=1){if(nodes_arr[i].nodeType===1&&nodes_arr[i].tagName===node.tagName){if(nodes_arr[i]===node){xpath[xpath.length]=[node.tagName.toUpperCase(),j];break}j+=1}}node=parent_node}if(idValid){xpath[xpath.length]=[node.id];if(core.utils.isIFrameDescendant(node)){loop=true;node=core.utils.getWindow(node).frameElement}}}}return xpath}return function getXPathFromNode(node){var xpath=getXPathArrayFromNode(node),parts=[],i=xpath.length;if(i<1){return"null"}while(i){i-=1;if(xpath[i].length>1){parts.push('["'+xpath[i][0]+'",'+xpath[i][1]+"]")}else{parts.push("["+serializer.serialize(xpath[i][0],"json")+"]")}}return("["+parts.join(",")+"]")}}());function extractResponseHeaders(headers){headers=headers.split("\n");var headersObj={},i=0,len=headers.length,header=null;for(i=0;i<len;i+=2){header=headers[i].split(": ");headersObj[header[0]]=header[1]}return headersObj}function isJQueryEvent(event){return event&&typeof event.originalEvent!=="undefined"&&typeof event.isDefaultPrevented!=="undefined"&&!event.isSimulated}function getEventDetails(event){if(!event){return null}if(event.type&&event.type.indexOf("touch")===0){if(isJQueryEvent(event)){event=event.originalEvent}if(event.type==="touchstart"){event=event.touches[event.touches.length-1]}else{if(event.type==="touchend"){event=event.changedTouches[0]}}}return event}function normalizeEvent(event){var e=event||window.event,doc=document.documentElement,body=document.body;if(isJQueryEvent(e)){e=e.originalEvent}if(typeof event==="undefined"||typeof e.target==="undefined"){e.target=e.srcElement||window.window;e.timeStamp=Number(new Date());if(e.pageX===null||typeof e.pageX==="undefined"){e.pageX=e.clientX+((doc&&doc.scrollLeft)||(body&&body.scrollLeft)||0)-((doc&&doc.clientLeft)||(body&&body.clientLeft)||0);e.pageY=e.clientY+((doc&&doc.scrollTop)||(body&&body.scrollTop)||0)-((doc&&doc.clientTop)||(body&&body.clientTop)||0)}e.preventDefault=function(){this.returnValue=false};e.stopPropagation=function(){this.cancelBubble=true}}return e}function normalizeTarget(event){var itemSource=null;if(!event){return null}if(event.srcElement){itemSource=event.srcElement}else{itemSource=event.target;if(!itemSource){itemSource=event.explicitOriginalTarget}if(!itemSource){itemSource=event.originalTarget}}if(!itemSource&&event.type.indexOf("touch")===0){itemSource=getEventDetails(event).target}while(itemSource&&nonClickableTags[itemSource.tagName]){itemSource=itemSource.parentNode}if(!itemSource&&event.srcElement===null){itemSource=window.window}return itemSource}function getEventPosition(event){var posX=0,posY=0,doc=document.documentElement,body=document.body;event=getEventDetails(event);if(event!==null){if(event.pageX&&event.pageY&&event.pageX>0&&event.pageY>0){posX=event.pageX;posY=event.pageY}else{if(event.clientX&&event.clientY){posX=event.clientX+((doc&&doc.scrollLeft)||(body&&body.scrollLeft)||0)-((doc&&doc.clientLeft)||(body&&body.clientLeft)||0);posY=event.clientY+((doc&&doc.scrollTop)||(body&&body.scrollTop)||0)-((doc&&doc.clientTop)||(body&&body.clientTop)||0)}}}return{x:posX,y:posY}}queryDom.xpath=function(query,scope){var xpath=serializer.parse(query),elem,pathElem=null,i,j,k,len,jlen;scope=typeof scope!=="undefined"?scope:document;elem=scope;if(!xpath){return null}for(i=0,len=xpath.length;i<len&&elem;i+=1){pathElem=xpath[i];if(pathElem.length===1){elem=scope.getElementById(pathElem[0])}else{for(j=0,k=-1,jlen=elem.childNodes.length;j<jlen;j+=1){if(elem.childNodes[j].nodeType===1&&elem.childNodes[j].tagName.toUpperCase()===pathElem[0]){k+=1;if(k===pathElem[1]){elem=elem.childNodes[j];break}}}if(k===-1){return null}}}return elem===scope||!elem?null:elem};function Point(x,y){this.x=x||0;this.y=y||0}function Size(width,height){this.width=width||0;this.height=height||0}function ElementData(event,target){var id,type,pos;target=normalizeTarget(event);id=this.examineID(target);type=this.examineType(target,event);pos=this.examinePosition(event,target);this.element=target;this.id=id.id;this.idType=id.type;this.type=type.type;this.subType=type.subType;this.state=this.examineState(target);this.position=new Point(pos.x,pos.y);this.size=new Size(pos.width,pos.height);this.xPath=id.xPath;this.name=id.name}ElementData.HTML_ID=-1;ElementData.XPATH_ID=-2;ElementData.ATTRIBUTE_ID=-3;ElementData.prototype.examineID=function(target){var id,type,xPath,attribute_id,name,i=customid.length,attrib;try{xPath=getXPathFromNode(target)}catch(e){}name=target.name;try{if(!core.utils.isIFrameDescendant(target)){if(checkId(target)){id=target.id;type=ElementData.HTML_ID}else{if(customid.length&&target.attributes){while(i){i-=1;attrib=target.attributes[customid[i]];if(typeof attrib!=="undefined"){id=customid[i]+"="+(attrib.value||attrib);type=ElementData.ATTRIBUTE_ID}}}}}}catch(e2){}if(!id){id=xPath;type=ElementData.XPATH_ID}return{id:id,type:type,xPath:xPath,name:name}};ElementData.prototype.examineType=function(target,event){var subType="";if(event.type==="change"){if(target.tagName==="TEXTAREA"||(target.tagName==="INPUT"&&target.type==="text")){subType="textChange"}else{subType="valueChange"}}else{subType=event.type}return{type:event.type,subType:subType}};ElementData.prototype.examineState=function(target){var tagnames={a:["innerText","href"],input:{range:["maxValue:max","value"],checkbox:["value","checked"],radio:["value","checked"],image:["src"]},select:["value"],button:["value","innerText"],textarea:["value"]},tagName=typeof target.tagName!=="undefined"?target.tagName.toLowerCase():"",properties=tagnames[tagName]||null,selectedOption=null,values=null,i=0,len=0,alias=null,key="";if(properties!==null){if(Object.prototype.toString.call(properties)==="[object Object]"){properties=properties[target.type]||["value"]}values={};for(key in properties){if(properties.hasOwnProperty(key)){if(properties[key].indexOf(":")!==-1){alias=properties[key].split(":");values[alias[0]]=target[alias[1]]}else{if(properties[key]==="innerText"){values[properties[key]]=target.innerText||target.textContent}else{values[properties[key]]=target[properties[key]]}}}}}if(tagName==="select"&&target.options&&!isNaN(target.selectedIndex)){values.index=target.selectedIndex;if(values.index>=0&&values.index<target.options.length){selectedOption=target.options[target.selectedIndex];values.value=selectedOption.getAttribute("value")||selectedOption.getAttribute("label")||selectedOption.text||selectedOption.innerText;values.text=selectedOption.text||selectedOption.innerText}}return values};function getZoomValue(){var factor=1,rect,physicalW,logicalW;if(document.body.getBoundingClientRect){try{rect=document.body.getBoundingClientRect()}catch(e){core.utils.clog("getBoundingClientRect failed.",e);return factor}physicalW=rect.right-rect.left;logicalW=document.body.offsetWidth;factor=Math.round((physicalW/logicalW)*100)/100}return factor}function getBoundingClientRectNormalized(element){var rect,rectangle,zoom;if(typeof element==="undefined"||element===null||!element.getBoundingClientRect){return{x:0,y:0,width:0,height:0}}try{rect=element.getBoundingClientRect()}catch(e){core.utils.clog("getBoundingClientRect failed.",e);return{x:0,y:0,width:0,height:0}}rectangle={x:rect.left,y:rect.top,width:rect.right-rect.left,height:rect.bottom-rect.top};
/*@cc_on
        // IE ONLY: the bounding rectangle include the top and left borders of the client area
        rectangle.x -= document.documentElement.clientLeft;
        rectangle.y -= document.documentElement.clientTop;

        zoom = getZoomValue();
        if (zoom !== 1) {  // IE 7 at non-default zoom level
            rectangle.x = Math.round(rectangle.x / zoom);
            rectangle.y = Math.round(rectangle.y / zoom);
            rectangle.width = Math.round(rectangle.width / zoom);
            rectangle.height = Math.round(rectangle.height / zoom);
        }
        @*/
return rectangle}ElementData.prototype.examinePosition=function(event,target){var posOnDoc=getEventPosition(event),elPos=getBoundingClientRectNormalized(target);elPos.x=posOnDoc.x!==0&&posOnDoc.y!==0?Math.round(Math.abs(posOnDoc.x-elPos.x)):elPos.width/2;elPos.y=posOnDoc.x!==0&&posOnDoc.y!==0?Math.round(Math.abs(posOnDoc.y-elPos.y)):elPos.height/2;return elPos};function WebEvent(event){var pos;event=normalizeEvent(event);pos=getEventPosition(event);this.custom=false;this.nativeEvent=this.custom===true?null:event;this.position=new Point(pos.x,pos.y);this.target=new ElementData(event,event.target);this.timestamp=(new Date()).getTime();this.type=event.type}function processDOMEvent(event){core._publishEvent(new WebEvent(event))}return{init:function(){if(!isInitialized){initBrowserBase()}else{}},destroy:function(){destroy()},extractResponseHeaders:extractResponseHeaders,WebEvent:WebEvent,ElementData:ElementData,processDOMEvent:processDOMEvent,queryDom:queryDom}});TLT.addService("browser",function(core){var configService=core.getService("config"),browserBaseService=core.getService("browserBase"),getXHRObject=null,addEventListener=null,removeEventListener=null,makeAjaxCall=null,serviceConfig=configService.getServiceConfig("browser")||{},useCapture=(serviceConfig.useCapture===true),isInitialized=false,errorCodes={NO_QUERY_SELECTOR:"NOQUERYSELECTOR"},wrapWebEvent=function(handler){return function(event){handler(new browserBaseService.WebEvent(event))}},loadScript=function(url){var fjs=document.getElementsByTagName("script")[0],js=document.createElement("script");js.src=url;fjs.parentNode.insertBefore(js,fjs)},queryDom={list2Array:function(nodeList){var len=nodeList.length,result=[],i;if(typeof nodeList.length==="undefined"){return[nodeList]}for(i=0;i<len;i+=1){result[i]=nodeList[i]}return result},find:function(query,scope,type){type=type||"css";return this.list2Array(this[type](query,scope))},css:function(query,scope){var self=this,message=null,bodyEl=document.getElementsByTagName("body")[0],bConfig=configService.getServiceConfig("browser")||{},sizzleURL=bConfig.sizzleURL||null,jQuery=bConfig.hasOwnProperty("jQueryObject")?core.utils.access(bConfig.jQueryObject):window.jQuery,sizzle=bConfig.hasOwnProperty("sizzleObject")?core.utils.access(bConfig.sizzleObject):window.Sizzle;if(typeof document.querySelectorAll==="undefined"){self.css=function(query,scope){scope=scope||document;return self.Sizzle(query,scope)};if(typeof self.Sizzle==="undefined"){if(sizzleURL){message={type:"GET",url:sizzleURL,async:false,oncomplete:function(result){function define(definition){self.Sizzle=definition()}define.amd=true;eval(result.responseText)}};makeAjaxCall(message)}else{try{if(bodyEl===sizzle("html > body",document)[0]){self.Sizzle=sizzle}}catch(e){try{if(bodyEl===jQuery(document).find("html > body").get()[0]){self.Sizzle=function(query,scope){return jQuery(scope).find(query).get()}}}catch(ex){core.fail("Sizzle was not found",errorCodes.NO_QUERY_SELECTOR)}}}}}else{self.css=function(query,scope){scope=scope||document;return scope.querySelectorAll(query)}}return self.css(query,scope)}},handlerMappings=(function(){var data=new core.utils.WeakMap();return{add:function(originalHandler){var handlers=data.get(originalHandler)||[wrapWebEvent(originalHandler),0];handlers[1]+=1;data.set(originalHandler,handlers);return handlers[0]},find:function(originalHandler){var handlers=data.get(originalHandler);return handlers?handlers[0]:null},remove:function(originalHandler){var handlers=data.get(originalHandler);if(handlers){handlers[1]-=1;if(handlers[1]<=0){data.remove(originalHandler)}}}}}()),convertHeaders=function(headersObj){var header="",headers=[];for(header in headersObj){if(headersObj.hasOwnProperty(header)){headers.push([header,headersObj[header]])}}return headers};makeAjaxCall=function(message){var xhr=getXHRObject(),headers=[["X-Requested-With","XMLHttpRequest"]],timeout=0,async=typeof message.async!=="boolean"?true:message.async,header="",callbackFn=null;if(message.headers){headers=headers.concat(convertHeaders(message.headers))}if(message.contentType){headers.push(["Content-Type",message.contentType])}xhr.open(message.type.toUpperCase(),message.url,async);core.utils.forEach(headers,function(header){if(header[0]&&header[1]){xhr.setRequestHeader(header[0],header[1])}});xhr.onreadystatechange=callbackFn=function(){if(xhr.readyState===4){xhr.onreadystatechange=callbackFn=function(){};if(message.timeout){window.clearTimeout(timeout)}message.oncomplete({headers:browserBaseService.extractResponseHeaders(xhr.getAllResponseHeaders()),responseText:(xhr.responseText||null),statusCode:xhr.status,success:(xhr.status===200)});xhr=null}};xhr.send(message.data||null);callbackFn();if(message.timeout){timeout=window.setTimeout(function(){if(!xhr){return}xhr.onreadystatechange=function(){};if(xhr.readyState!==4){xhr.abort()}xhr=null},message.timeout)}};function initBrowserServiceW3C(){queryDom.xpath=browserBaseService.queryDom.xpath;if(typeof window.XMLHttpRequest!=="undefined"){getXHRObject=function(){return new XMLHttpRequest()}}else{getXHRObject=function(){return new ActiveXObject("Microsoft.XMLHTTP")}}if(typeof document.addEventListener==="function"){addEventListener=function(target,eventName,handler){target.addEventListener(eventName,handler,useCapture)};removeEventListener=function(target,eventName,handler){target.removeEventListener(eventName,handler,useCapture)}}else{if(typeof document.attachEvent!=="undefined"){addEventListener=function(target,eventName,handler){target.attachEvent("on"+eventName,handler)};removeEventListener=function(target,eventName,handler){target.detachEvent("on"+eventName,handler)}}else{throw new Error("Unsupported browser")}}isInitialized=true}return{init:function(){if(!isInitialized){initBrowserServiceW3C()}else{}},destroy:function(){isInitialized=false},getServiceName:function(){return"W3C"},query:function(query,scope,type){return queryDom.find(query,scope,type)[0]||null},queryAll:function(query,scope,type){return queryDom.find(query,scope,type)},loadScript:function(url){loadScript(url)},sendRequest:function(message){message.type=message.type||"POST";makeAjaxCall(message)},subscribe:function(eventName,target,handler){var wrappedHandler=handlerMappings.add(handler);addEventListener(target,eventName,wrappedHandler)},unsubscribe:function(eventName,target,handler){var wrappedHandler=handlerMappings.find(handler);if(wrappedHandler){removeEventListener(target,eventName,wrappedHandler);handlerMappings.remove(handler)}}}});TLT.addService("message",function(C){var y=null,i=0,f=0,A=new Date(),e=new Date(),m=C.getService("browserBase"),B=C.getService("browser"),F=C.getService("config"),G=F.getServiceConfig("message")||{},x=window.location.href,l="TODO",n="ID"+e.getHours()+"H"+e.getMinutes()+"M"+e.getSeconds()+"S"+e.getMilliseconds()+"R"+Math.random(),H=G.hasOwnProperty("privacy")?G.privacy:[],h={},q={lower:"x",upper:"X",numeric:"9",symbol:"@"},g=navigator.userAgent.indexOf("iPhone")>-1||navigator.userAgent.indexOf("iPod")>-1||navigator.userAgent.indexOf("iPad")>-1,z=window.devicePixelRatio||1,s=window.screen?window.screen.width:0,r=window.screen?window.screen.height:0,j=window.orientation||0,d=g?s:s<=320?s:s/z,D=g?r:s<=320?r:r/z,c=(window.screen===null?0:window.screen.height-window.screen.availHeight),p=window.innerWidth||document.documentElement.clientWidth,t=window.innerHeight||document.documentElement.clientHeight,w=false;function a(J){var I="";this.type=J.type;this.offset=(new Date()).getTime()-A.getTime();if((J.type===2)||(y===null)){y=new Date()}this.screenviewOffset=(new Date()).getTime()-y.getTime();this.count=(f+=1);this.fromWeb=true;for(I in J){if(J.hasOwnProperty(I)){this[I]=J[I]}}}h.PVC_MASK_EMPTY=function(I){return""};h.PVC_MASK_BASIC=function(J){var I="XXXXX";if(typeof J!=="string"){return""}return(J.length?I:"")};h.PVC_MASK_TYPE=function(M){var J,L=0,I=0,K="";if(typeof M!=="string"){return K}J=M.split("");for(L=0,I=J.length;L<I;L+=1){if(C.utils.isNumeric(J[L])){K+=q.numeric}else{if(C.utils.isUpperCase(J[L])){K+=q.upper}else{if(C.utils.isLowerCase(J[L])){K+=q.lower}else{K+=q.symbol}}}}return K};h.PVC_MASK_EMPTY.maskType=1;h.PVC_MASK_BASIC.maskType=2;h.PVC_MASK_TYPE.maskType=3;h.PVC_MASK_CUSTOM={maskType:4};function v(I,K){var J=h.PVC_MASK_BASIC;if(I.maskType===h.PVC_MASK_EMPTY.maskType){J=h.PVC_MASK_EMPTY}else{if(I.maskType===h.PVC_MASK_BASIC.maskType){J=h.PVC_MASK_BASIC}else{if(I.maskType===h.PVC_MASK_TYPE.maskType){J=h.PVC_MASK_TYPE}else{if(I.maskType===h.PVC_MASK_CUSTOM.maskType){J=I.maskFunction}}}}if(typeof K.target.prevState!=="undefined"&&K.target.prevState.hasOwnProperty("value")){K.target.prevState.value=J(K.target.prevState.value)}if(typeof K.target.currState!=="undefined"&&K.target.currState.hasOwnProperty("value")){K.target.currState.value=J(K.target.currState.value)}}function u(O,P){var M,L,Q,I,K,R,N,J;for(M=0,N=O.length;M<N;M+=1){J=O[M];if(typeof J==="string"){Q=B.queryAll(J);for(L=0,I=Q?Q.length:0;L<I;L+=1){if(Q[L]){K=m.ElementData.prototype.examineID(Q[L]);if(K.type===P.idType&&K.id===P.id){return true}}}}else{if(J.id&&J.idType&&P.idType.toString()===J.idType.toString()){switch(typeof J.id){case"string":if(J.id===P.id){return true}break;case"object":R=new RegExp(J.id.regex,J.id.flags);if(R.test(P.id)){return true}break}}}}return false}function b(L){var K,I,J;if(!L||!L.hasOwnProperty("target")){return L}for(K=0,I=H.length;K<I;K+=1){J=H[K];if(u(J.targets,L.target)){v(J,L);break}}return L}function k(){F=C.getService("config");G=F.getServiceConfig("message")||{};H=G.hasOwnProperty("privacy")?G.privacy:[]}function o(){if(F.subscribe){F.subscribe("configupdated",k)}w=true}function E(){F.unsubscribe("configupdated",k);w=false}return{init:function(){if(!w){o()}else{}},destroy:function(){E()},createMessage:function(I){if(typeof I.type==="undefined"){throw new TypeError("Invalid queueEvent given!")}return b(new a(I))},wrapMessages:function(J){var I={messageVersion:"2.1.0.0",serialNumber:(i+=1),sessions:[{id:n,startTime:e.getTime(),timezoneOffset:e.getTimezoneOffset(),messages:J,clientEnvironment:{webEnvironment:{libVersion:"2.1.0.856",page:x,windowId:l,screen:{devicePixelRatio:z,deviceOriginalWidth:g?s*z:s,deviceOriginalHeight:g?r*z:r,deviceWidth:d,deviceHeight:D,deviceToolbarHeight:c,width:p,height:t,orientation:j}}}}]},K=I.sessions[0].clientEnvironment.webEnvironment.screen;K.orientationMode=C.utils.getOrientationMode(K.orientation);return I}}});TLT.addService("serializer",function(core){function serializeToJSON(obj){var str,key,len=0;if(typeof obj!=="object"||obj===null){switch(typeof obj){case"function":case"undefined":return"null";case"string":return'"'+obj.replace(/\"/g,'\\"')+'"';default:return String(obj)}}else{if(Object.prototype.toString.call(obj)==="[object Array]"){str="[";for(key=0,len=obj.length;key<len;key+=1){if(Object.prototype.hasOwnProperty.call(obj,key)){str+=serializeToJSON(obj[key])+","}}}else{str="{";for(key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)){str=str.concat('"',key,'":',serializeToJSON(obj[key]),",");len+=1}}}}if(len>0){str=str.substring(0,str.length-1)}str+=String.fromCharCode(str.charCodeAt(0)+2);return str}var configService=core.getService("config"),serialize={},parse={},defaultSerializers={json:(function(){if(typeof window.JSON!=="undefined"){return{serialize:window.JSON.stringify,parse:window.JSON.parse}}return{serialize:serializeToJSON,parse:function(data){return eval("("+data+")")}}}())},isInitialized=false;function addObjectIfExist(paths,rootObj,propertyName){var i,len,obj;paths=paths||[];for(i=0,len=paths.length;i<len;i+=1){obj=paths[i];if(typeof obj==="string"){obj=core.utils.access(obj)}if(typeof obj==="function"){rootObj[propertyName]=obj;break}}}function initSerializerService(config){var format;for(format in config){if(config.hasOwnProperty(format)){addObjectIfExist(config[format].stringifiers,serialize,format);addObjectIfExist(config[format].parsers,parse,format)}}if(!(config.json&&config.json.hasOwnProperty("defaultToBuiltin"))||config.json.defaultToBuiltin===true){serialize.json=serialize.json||defaultSerializers.json.serialize;parse.json=parse.json||defaultSerializers.json.parse}if(typeof serialize.json!=="function"||typeof parse.json!=="function"){core.fail("JSON parser and/or serializer not provided in the UIC config. Can't continue.")}if(configService.subscribe){configService.subscribe("configupdated",updateConfig)}isInitialized=true}function destroy(){serialize={};parse={};configService.unsubscribe("configupdated",updateConfig);isInitialized=false}function updateConfig(){configService=core.getService("config");initSerializerService(configService.getServiceConfig("serializer")||{})}return{init:function(){if(!isInitialized){initSerializerService(configService.getServiceConfig("serializer")||{})}else{}},destroy:function(){destroy()},parse:function(data,type){type=type||"json";return parse[type](data)},serialize:function(data,type){type=type||"json";return serialize[type](data)}}});if(TLT&&typeof TLT.addModule==="function"){TLT.addModule("performance",function(f){var h={loadReceived:false,unloadReceived:false,perfEventSent:false},g=0;function b(j,i){if(typeof j!=="string"){return false}if(!i||typeof i!=="object"){return false}return(i[j]===true)}function e(k,i){var m=0,j={},n="",l=0;if(!k||typeof k!=="object"||!k.navigationStart){return{}}m=k.navigationStart;for(n in k){if(Object.prototype.hasOwnProperty.call(k,n)||typeof k[n]==="number"){if(!b(n,i)){l=k[n];if(typeof l==="number"&&l){j[n]=l-m}else{j[n]=l}}}}return j}function d(l){var m=0,k,j,i=f.utils;if(l){k=l.responseEnd;j=l.loadEventStart;if(i.isNumeric(k)&&i.isNumeric(j)&&j>k){m=j-k}}return m}function c(j){var i=f.getStartTime();if(j.timestamp>i&&!g){g=j.timestamp-i}}function a(m){var k=f.getConfig()||{},j="UNKNOWN",n={type:7,performance:{}},i,o,l;if(!m||h.perfEventSent){return}o=m.performance||{};l=o.timing;i=o.navigation;if(l){n.performance.timing=e(l,k.filter);n.performance.timing.renderTime=d(l)}else{if(k.calculateRenderTime){n.performance.timing={renderTime:g,calculated:true}}}if(i){switch(i.type){case 0:j="NAVIGATE";break;case 1:j="RELOAD";break;case 2:j="BACKFORWARD";break;default:j="UNKNOWN";break}n.performance.navigation={type:j,redirectCount:i.redirectCount}}f.post(n);h.perfEventSent=true}return{init:function(){},destroy:function(){},onevent:function(i){if(typeof i!=="object"||!i.type){return}switch(i.type){case"load":h.loadReceived=true;c(i);break;case"unload":h.unloadReceived=true;if(!h.perfEventSent){a(window)}break;default:break}},onmessage:function(i){}}})}else{}TLT.addModule("replay",function(ag){var A={"input:radio":"radioButton","input:checkbox":"checkBox","input:text":"textBox","input:password":"textBox","input:file":"fileInput","input:button":"button","input:submit":"submitButton","input:reset":"resetButton","input:image":"image","input:color":"color","input:date":"date","input:datetime":"datetime","input:datetime-local":"datetime-local","input:number":"number","input:email":"email","input:tel":"tel","input:search":"search","input:url":"url","input:time":"time","input:week":"week","textarea:":"textBox","select:":"selectList","button:":"button","a:":"link"},K=window.orientation||0,ad={scale:0,timestamp:0},Y={},B=window.location.hash,F=null,e=[],Z=0,ab=null,z=null,k=0,T="",x="",O=(new Date()).getTime(),j=0,Q=null,ae=null,P=null,W=0,u=0,ac=null,t={inFocus:false},L=null,y=navigator.userAgent.indexOf("iPhone")>-1||navigator.userAgent.indexOf("iPod")>-1||navigator.userAgent.indexOf("iPad")>-1,p=window.devicePixelRatio||1,o=(window.screen===null?0:window.screen.width),E=(window.screen===null?0:window.screen.height),U=(window.screen===null?0:window.screen.height-window.screen.availHeight),J=ag.getConfig(),R;function I(ak,aj){var ai,ah;if(!ak||typeof ak!=="object"){return null}ah=aj.split(".");for(ai=0;ai<ah.length;ai+=1){if((typeof ak==="undefined")||(ak[ah[ai]]===null)){return null}ak=ak[ah[ai]]}return ak}function g(ai){var ah=[];ai=ai.parentNode;while(ai){ah.push(ai);ai=ai.parentNode}return ah}function v(ah){return ag.utils.some(ah,function(ai){if(ai.tagName==="A"||ai.tagName==="BUTTON"){return ai}return null})}function m(ah){var ai=ah.type;if(typeof ai==="string"){ai=ai.toLowerCase()}else{ai="unknown"}if(ai==="blur"){ai="focusout"}return ai}function X(ap){var aj,ai=I(ap,"webEvent.target.element.tagName"),ak=ai.toLowerCase()==="input"?I(ap,"webEvent.target.element.type"):"",ah=A[ai.toLowerCase()+":"+ak]||ai,am=g(I(ap,"webEvent.target.element")),ao=null,al=I(ap,"webEvent.target.position.relXY"),an=I(ap,"webEvent.target.subtype");aj={type:4,target:{id:ap.id||"",idType:I(ap,"webEvent.target.idType"),name:I(ap,"webEvent.target.name"),tlType:ah,type:ai,subType:ak,position:{width:I(ap,"webEvent.target.element.offsetWidth"),height:I(ap,"webEvent.target.element.offsetHeight")},currState:ap.currState||null},event:{tlEvent:m(I(ap,"webEvent")),type:I(ap,"webEvent.target.type")}};if(al){aj.target.position.relXY=al}if(typeof ap.dwell==="number"&&ap.dwell>0){aj.target.dwell=ap.dwell}if(typeof ap.visitedCount==="number"){aj.target.visitedCount=ap.visitedCount}if(typeof ap.prevState!=="undefined"){aj.prevState=ap.prevState}if(typeof an!=="undefined"){aj.event.subType=an}aj.target.name=I(ap,"webEvent.target.name");ao=v(am);aj.target.isParentLink=!!ao;if(ao){if(ao.href){aj.target.currState=aj.target.currState||{};aj.target.currState.href=aj.target.currState.href||ao.href}if(ao.value){aj.target.currState=aj.target.currState||{};aj.target.currState.value=aj.target.currState.value||ao.value}if(ao.innerText||ao.textContent){aj.target.currState=aj.target.currState||{};aj.target.currState.innerText=aj.target.currState.innerText||ao.innerText||ao.textContent}}return aj}function C(ah){ag.post(ah)}function H(al){var aj=0,ah,am=al.length,ao,an,ak,ap={mouseout:true,mouseover:true},ai=[];for(aj=0;aj<am;aj+=1){ao=al[aj];if(!ao){continue}if(ap[ao.event.type]){ai.push(ao)}else{for(ah=aj+1;ah<am&&al[ah]&&ap[al[ah].event.type];ah+=1){}if(ah<am){an=al[ah];if(an&&ao.target.id===an.target.id&&ao.event.type!==an.event.type){if(ao.event.type==="click"){ak=ao;ao=an;an=ak}if(an.event.type==="click"){ao.target.position=an.target.position;aj+=1}else{if(an.event.type==="blur"){ao.target.dwell=an.target.dwell;ao.target.visitedCount=an.target.visitedCount;ao.focusInOffset=an.focusInOffset;ao.target.position=an.target.position;aj+=1}}al[ah]=null;al[aj]=ao}}ai.push(al[aj])}}while((ao=ai.shift())){ag.post(ao)}al.splice(0,al.length)}if(typeof window.onerror!=="function"){window.onerror=function(ak,aj,ah){var ai=null;if(typeof ak!=="string"){return}ah=ah||-1;ai={type:6,exception:{description:ak,url:aj,line:ah}};k+=1;ag.post(ai)}}function n(ai,ah){t=ah;t.inFocus=true;if(typeof Y[ai]==="undefined"){Y[ai]={}}Y[ai].focus=t.dwellStart=Number(new Date());Y[ai].focusInOffset=P?t.dwellStart-Number(P):-1;Y[ai].prevState=I(ah,"target.state");Y[ai].visitedCount=Y[ai].visitedCount+1||1}function V(ah,ai){e.push(X({webEvent:ah,id:ai,currState:I(ah,"target.state")}))}function q(aj){var ah=false,ai="|button|image|submit|reset|checkbox|radio|",ak=null;if(typeof aj!=="object"||!aj.type){return ah}switch(aj.type){case"INPUT":ak="|"+(aj.subType||"")+"|";if(ai.indexOf(ak.toLowerCase())===-1){ah=false}else{ah=true}break;case"TEXTAREA":ah=false;break;default:ah=true;break}return ah}function d(aj,ai){var ah;if(typeof aj==="undefined"||aj===null||typeof ai==="undefined"||ai===null){return}t.inFocus=false;if(typeof Y[aj]!=="undefined"&&Y[aj].hasOwnProperty("focus")){Y[aj].dwell=Number(new Date())-Y[aj].focus}else{Y[aj]={};Y[aj].dwell=0}if(e.length===0){ai.type=ai.target.type="blur";V(ai,aj)}ah=e[e.length-1];if(ah){ah.target.dwell=Y[aj].dwell;ah.focusInOffset=Y[aj].focusInOffset;ah.target.visitedCount=Y[aj].visitedCount;if(ah.event.type==="click"&&!q(ah.target)){ah.event.type="blur";ah.event.tlEvent="focusout"}}H(e)}function l(aj,ai){var ah=false;if(e[e.length-1]&&e[e.length-1].target.id!==aj&&ai.type!=="scroll"&&ai.type!=="resize"&&ai.type!=="mouseout"&&ai.type!=="mouseover"&&(e[e.length-1].target.tlType!=="textBox"&&e[e.length-1].target.tlType!=="selectList")){d(e[e.length-1].target.id,e[e.length-1]);ah=true}return ah}function c(ai,ah){if(typeof Y[ai]!=="undefined"&&!Y[ai].hasOwnProperty("focus")){n(ai,ah)}V(ah,ai);if(typeof Y[ai]!=="undefined"&&typeof Y[ai].prevState!=="undefined"){if(e[e.length-1].target.tlType==="textBox"||e[e.length-1].target.tlType==="selectList"){e[e.length-1].target.prevState=Y[ai].prevState}}}function D(aj){var ai=aj.target.position.x,an=aj.target.position.y,ak=aj.target.size.width,ah=aj.target.size.height,am=Math.abs(ai/ak).toFixed(1),al=Math.abs(an/ah).toFixed(1);am=am>1||am<0?0.5:am;al=al>1||al<0?0.5:al;return am+","+al}function b(al,aj){var ai,ah=true,ak=0;if(aj.target.element.tagName==="SELECT"&&L&&L.target.id===al){L=null;return}if(!t.inFocus){n(al,aj)}ak=e.length;if(ak&&I(e[ak-1],"event.type")!=="change"){c(al,aj)}ai=D(aj);ak=e.length;if(aj.position.x===0&&aj.position.y===0&&ak&&I(e[ak-1],"target.tlType")==="radioButton"){ah=false}else{aj.target.position.relXY=ai}if(ak&&I(e[ak-1],"target.id")===al){if(ah){e[ak-1].target.position.relXY=ai}}else{V(aj,al)}L=aj}function aa(){var ah=window.orientation||0;return ah}function a(ai){var ah=aa(),aj={type:4,event:{type:"orientationchange"},target:{prevState:{orientation:K,orientationMode:ag.utils.getOrientationMode(K)},currState:{orientation:ah,orientationMode:ag.utils.getOrientationMode(ah)}}};C(aj);K=ah}function af(ai){var ah=false;if(!ai){return ah}ah=(ad.scale===ai.scale&&Math.abs((new Date()).getTime()-ad.timestamp)<500);return ah}function i(ah){ad.scale=ah.scale;ad.rotation=ah.rotation;ad.timestamp=(new Date()).getTime()}function N(aj){var ah,ai="INVALID";if(typeof aj==="undefined"||aj===null){return ai}ah=Number(aj);if(isNaN(ah)){ai="INVALID"}else{if(ah<1){ai="CLOSE"}else{if(ah>1){ai="OPEN"}else{ai="NONE"}}}return ai}function h(aj){var ai={},ak=I(aj,"nativeEvent.rotation")||0,al=I(aj,"nativeEvent.scale")||1,ah=null,am={type:4,event:{type:"touchend"},target:{id:I(aj,"target.id"),idType:I(aj,"target.idType")}};if((y&&(!al||al===1))||(!y&&aj.nativeEvent.touches.length<=1)){return}ah={rotation:ak?ak.toFixed(2):0,scale:al?al.toFixed(2):1};ah.pinch=N(ah.scale);if(af(ah)){return}if(ad&&ad.timestamp){ai.rotation=ad.rotation;ai.scale=ad.scale;ai.pinch=N(ai.scale)}if(I(ai,"scale")){am.target.prevState=ai}am.target.currState=ah;C(am);i(ah)}function S(ai){var ah={type:1,clientState:{pageWidth:document.width||(document.documentElement===null?0:document.documentElement.offsetWidth),pageHeight:Math.max((typeof document.height==="undefined"?0:document.height),(typeof document.documentElement==="undefined"?0:document.documentElement.offsetHeight),(typeof document.documentElement==="undefined"?0:document.documentElement.scrollHeight)),viewPortWidth:window.innerWidth||document.documentElement.clientWidth,viewPortHeight:window.innerHeight||document.documentElement.clientHeight,viewPortX:window.pageXOffset||(document.body===null?0:document.body.scrollLeft),viewPortY:window.pageYOffset||(document.body===null?0:document.body.scrollTop),deviceOrientation:window.orientation||0,event:I(ai,"type")}},aj=1,ak=1;if(Math.abs(ah.clientState.deviceOrientation)===90){if(y){aj=E-U}else{aj=o<=320?E-U:((E/p)-U)}}else{if(y){aj=o+U}else{aj=o<=320?o-U:((o/p)-U)}}ak=(ah.clientState.viewPortWidth===0?1:aj/ah.clientState.viewPortWidth);ah.clientState.deviceScale=ak-0.02;ah.clientState.deviceScale=ah.clientState.deviceScale.toFixed(3);ah.clientState.viewTime=ae===null?0:(new Date()).getTime()-ae.getTime();if(ai.type==="scroll"&&Z<=0){W=z.clientState.viewPortX;u=z.clientState.viewPortY}if(ai.type==="scroll"){ah.clientState.viewPortXStart=W;ah.clientState.viewPortYStart=u}ab=ag.utils.clone(ah);return ah}function w(){if(ab!==null&&ab.clientState.event!=="load"){if(ab.clientState.event==="scroll"){delete ab.clientState.viewPortXStart;delete ab.clientState.viewPortYStart}ab.clientState.event="attention";ab.clientState.viewTime=P===null?0:(new Date()).getTime()-P.getTime();C(ab);P=new Date();return true}return false}function r(ah){if((ah.clientState.event==="scroll")&&(ah.clientState.viewPortXStart===ah.clientState.viewPortX)&&(ah.clientState.viewPortYStart===ah.clientState.viewPortY)){return false}return true}function G(ai){var ah=ac===null?0:(new Date()).getTime()-ac.getTime();if(ab!==null&&(ai.type!==ab.clientState.event||ah>=1000)){if(r(ab)){C(ab);if(ab.clientState.event!=="touchend"){z=ag.utils.clone(ab)}}ab=null;ae=null;Z=0;return true}if(ab!==null&&(Z===1&&ah>=1000)&&(ab.clientState.event==="resize"||ab.clientState.event==="scroll"||ab.clientState.event==="orientationchange"||ai.type==="screenview_load")){w()}return false}function f(ar,ak){var ao=["type","target.id"],aj=null,al,an,am=true,ap=10,ai=0,aq=0,ah=0;if(!ar||!ak||typeof ar!=="object"||typeof ak!=="object"){am=false}for(al=0,an=ao.length;am&&al<an;al+=1){aj=ao[al];if(I(ar,aj)!==I(ak,aj)){am=false;break}}if(am){aq=I(ar,"timestamp");ah=I(ak,"timestamp");if(!(isNaN(aq)&&isNaN(ah))){ai=Math.abs(I(ar,"timestamp")-I(ak,"timestamp"));if(isNaN(ai)||ai>ap){am=false}}}return am}function M(){var ah=window.location.hash;if(ah===B){return}if(B){TLT.logScreenviewUnload(B)}if(ah){TLT.logScreenviewLoad(ah)}B=ah}function s(ah){var ai={type:4,event:{type:ah.type},target:{id:I(ah,"target.id"),idType:I(ah,"target.idType")}};C(ai)}return{init:function(){},destroy:function(){d(F)},onevent:function(ah){var aj=null,ai=null;if(typeof ah!=="object"||!ah.type){return}if(f(ah,Q)){Q=ah;return}Q=ah;aj=I(ah,"target.id");if(Object.prototype.toString.call(Y[aj])!=="[object Object]"){Y[aj]={}}G(ah);l(aj,ah);ac=new Date();switch(ah.type){case"hashchange":M();break;case"focus":ai=n(aj,ah);break;case"blur":ai=d(aj,ah);break;case"click":ai=b(aj,ah);break;case"change":ai=c(aj,ah);break;case"orientationchange":ai=a(ah);break;case"touchend":ai=h(ah);ai=S(ah);break;case"load":TLT.logScreenviewLoad("root");ai=S(ah);P=new Date();break;case"screenview_load":P=new Date();break;case"resize":case"scroll":if(ae===null&&Z<=0){ae=new Date()}ai=S(ah);if(r(ai)){ai=null}else{Z+=1}break;case"unload":if(e!==null){H(e)}ai=S(ah);w();C(ai);TLT.logScreenviewUnload("root");break;default:s(ah);break}F=aj;return ai},onmessage:function(){}}});
(function () {
var changeTarget;
/*@cc_on
    if (@_jscript_version < 9 || (window.performance && document.documentMode < 9)) {
        changeTarget = "input, select, textarea, button";
    }
@*/
TLT.init({"services":{"browser":{"sizzleObject":"window.Sizzle"},"queue":[{"qid":"DEFAULT","endpoint":"/static/tealeafTarget2.html","maxEvents":25,"timerinterval":0}],"message":{"privacy":[{"targets":["input[name=secnum]","input[name=upwd]","input[name=upwd0]","input[name=aet_fon_0_phct]","input[name=aet_fon_1_phct]","input[name=aet_fon_2_phct]","input[name=aet_fon_1_phac]","input[name=aet_fon_2_phac]","input[name=aet_fon_0_phnm]","input[name=aet_fon_1_phnm]","input[name=aet_fon_2_phnm]","input[name=aet_fon_1_phex]","input[name=aet_wec_wnm_fnam_1]","input[name=aet_wec_phn_phct]","input[name=aet_wec_phn_phac]","input[name=aet_wec_phn_phnm]","input[name=trpr26_FWT_0_wnmSh]","input[name=trpr26_FWT_0_fon_0Sh]","input[name=trpr26_FWT_0_fon_1Sh]","input[name=trpr26_FWT_0_fon_2Sh]","input[name=trpr26_FWT_0_fon_0_phct]","input[name=trpr26_FWT_0_fon_0_phac]","input[name=trpr26_FWT_0_fon_0_phnm]","input[name=trpr26_FWT_0_fon_0_phex]","input[name=trpr26_FWT_0_wec_phn_phct]","input[name=trpr26_FWT_0_wec_phn_phac]","input[name=trpr26_FWT_0_wec_phn_phnm]","input[name=FOPIH_RgWebCC_0_cvmo]","input[name=FOPIH_RgWebCC_0_cvyr]","input[name=FOPIH_RgWebCC_0_ccin]","input[name=FOPIH_RgWebCC_0_IHFOPCommon_fpds]","input[name=tkdl26_IHftkt_IHihda_IHalda_adap]","input[name=tkdl26_IHftkt_IHihda_IHalda_adcn]","input[name=trpr26_HotTPref_0_htrvl_wtid]","input[name=trpr26_HotTPref_0_htrvl_wnmSh]","input[name=trpr26_HotTPref_0_htrvl_fon_0Sh]","input[name=trpr26_HotTPref_0_htrvl_fon_1Sh]","input[name=trpr26_HotTPref_0_htrvl_fon_2Sh]","input[name=trpr26_HotTPref_0_htrvl_fon_1_phct]","input[name=trpr26_HotTPref_0_htrvl_fon_1_phac]","input[name=trpr26_HotTPref_0_htrvl_fon_1_phnm]","input[name=trpr26_HotTPref_0_htrvl_fon_1_phex]","input[name=trpr26_HotTPref_0_htrvl_fon_0_phct]","input[name=trpr26_HotTPref_0_htrvl_fon_0_phac]","input[name=trpr26_HotTPref_0_htrvl_fon_0_phnm]","input[name=trpr26_WT_wtid]","input[name=trpr26_WT_wnmSh]","input[name=trpr26_WT_fon_0Sh]","input[name=trpr26_WT_fon_1Sh]","input[name=trpr26_WT_fon_2Sh]","input[name=trpr26_WT_fon_1_phct]","input[name=trpr26_WT_fon_1_phac]","input[name=trpr26_WT_fon_1_phnm]","input[name=trpr26_WT_fon_1_phex]","input[name=trpr26_WT_fon_0_phct]","input[name=trpr26_WT_fon_0_phac]","input[name=trpr26_WT_fon_0_phnm]","input[name=trpr27_FWT_0_wtid]","input[name=trpr27_FWT_0_wnmSh]","input[name=trpr27_FWT_0_fon_0Sh]","input[name=trpr27_FWT_0_fon_1Sh]","input[name=trpr27_FWT_0_fon_2Sh]","input[name=trpr27_FWT_fon_1_phct]","input[name=trpr27_FWT_fon_1_phac]","input[name=trpr27_FWT_fon_1_phnm]","input[name=trpr27_FWT_fon_1_phex]","input[name=trpr27_FWT_0_fon_0_phct]","input[name=trpr27_FWT_0_fon_0_phac]","input[name=trpr27_FWT_0_fon_0_phnm]","input[name=trpr27_FWT_0_wec_phnTxt]","input[name=trpr27_FWT_0_wec_phn_phct]","input[name=trpr27_FWT_0_wec_phn_phac]","input[name=trpr27_FWT_0_wec_phn_phnm]","input[name=trpr27_FWT_0_wec_phn_phex]","input[name=trpr28_HotTPref_0_htrvl_wtid]","input[name=trpr28_HotTPref_0_htrvl_wnmSh]","input[name=trpr28_HotTPref_0_htrvl_fon_0Sh]","input[name=trpr28_HotTPref_0_htrvl_fon_1Sh]","input[name=trpr28_HotTPref_0_htrvl_fon_2Sh]","input[name=trpr28_HotTPref_0_htrvl_fon_1_phct]","input[name=trpr28_HotTPref_0_htrvl_fon_1_phac]","input[name=trpr28_HotTPref_0_htrvl_fon_1_phnm]","input[name=trpr28_HotTPref_0_htrvl_fon_1_phex]","input[name=trpr28_HotTPref_0_htrvl_fon_0_phct]","input[name=trpr28_HotTPref_0_htrvl_fon_0_phac]","input[name=trpr28_HotTPref_0_htrvl_fon_0_phnm]","input[name=trpr29_WT_wtid]","input[name=trpr29_WT_wnmSh]","input[name=trpr29_WT_fon_0Sh]","input[name=trpr29_WT_fon_1Sh]","input[name=trpr29_WT_fon_2Sh]","input[name=trpr29_WT_fon_1_phct]","input[name=trpr29_WT_fon_1_phac]","input[name=trpr29_WT_fon_1_phnm]","input[name=trpr29_WT_fon_1_phex]","input[name=trpr29_WT_fon_0_phct]","input[name=trpr29_WT_fon_0_phac]","input[name=trpr29_WT_fon_0_phnm]","input[name=FOPIH_RgWebCC_1_ccty]","input[name=trpr26_KCTravPref_0_KWT_0_wtid]","input[name=inp_trpr26_KCTravPref_0_KWT_0_ttle]","input[name=trpr26_KCTravPref_0_KWT_0_wnmSh]","input[name=trpr26_KCTravPref_0_KWT_0_fon_0Sh]","input[name=trpr26_KCTravPref_0_KWT_0_fon_1Sh]","input[name=trpr26_KCTravPref_0_KWT_0_fon_2Sh]","input[name=trpr26_KCTravPref_0_KWT_0_fon_1_phct]","input[name=trpr26_KCTravPref_0_KWT_0_fon_1_phac]","input[name=trpr26_KCTravPref_0_KWT_0_fon_1_phnm]","input[name=trpr26_KCTravPref_0_KWT_0_fon_1_phex]","input[name=trpr26_KCTravPref_0_KWT_0_fon_0_phct]","input[name=trpr26_KCTravPref_0_KWT_0_fon_0_phac]","input[name=trpr26_KCTravPref_0_KWT_0_fon_0_phnm]","input[name=trpr26_KCTravPref_0_KWT_0_CCKTA_kbdy]","input[name=trpr26_KCTravPref_0_KWT_0_natl]","input[name=tkdl26_IHkdel_IHadel_rcnm]","input[name=tkdl26_IHkdel_IHadel_ads1]","input[name=tkdl26_IHkdel_IHadel_adap]","input[name=tkdl26_IHkdel_IHadel_adct]","input[name=tkdl26_IHkdel_IHadel_adst]","input[name=tkdl26_IHkdel_IHadel_adzp]","input[name=tkdl26_IHkdel_IHadel_adcn]","input[name=trpr26_TSPrimCom_wtid]","input[name=trpr26_TSPrimCom_wnmSh]","input[name=trpr26_TSPrimCom_fon_0Sh]","input[name=trpr26_TSPrimCom_fon_1Sh]","input[name=trpr26_TSPrimCom_fon_0Sh]","input[name=trpr26_TSPrimCom_fon_1_phct]","input[name=trpr26_TSPrimCom_fon_1_phac]","input[name=trpr26_TSPrimCom_fon_1_phnm]","input[name=trpr26_TSPrimCom_fon_1_phex]","input[name=trpr26_TSPrimCom_fon_0_phct]","input[name=trpr26_TSPrimCom_fon_0_phac]","input[name=trpr26_TSPrimCom_fon_0_phnm]","input[name=ccty]","input[name=ccnu]","input[name=ccmo]","input[name=ccyr]","input[name=cfnm]","input[name=clnm]","input[name=adcm1]","input[name=ads11]","input[name=ads21]","input[name=adap1]","input[name=adct1]","input[name=adst1]","input[name=adzp1]","input[name=adcn1]","input[name=phct1]","input[name=phac1]","input[name=phnm1]","input[name=phex1]","input[name=pasc]","input[name=pas1]","input[name=pas2]","input[name=usremal]","input[name=CardHolder_creditcardCVC]","input[name=new_card_security_code]","input[name=password]","input[name=oldPassword]","input[name=newPassword]","input[name=confirmPassword]","input[name=repeat_password]","input[name=solo_issue_number]","input[name=loginWidget_inpUserPwd]","input[name=stored_card_security_code]","input[name=loginPassword]","input[name=trpr26_FWT_0_PP_pnum]","input[name=trpr26_FWT_1_PP_pnum]","input[name=trpr26_FWT_2_PP_pnum]","input[name=trpr26_FWT_3_PP_pnum]","input[name=trpr26_FWT_4_PP_pnum]","input[name=trpr26_FWT_5_PP_pnum]","input[name=trpr26_FWT_6_PP_pnum]","input[name=trpr27_FWT_0_PP_pnum]","input[name=trpr27_FWT_1_PP_pnum]","input[name=trpr27_FWT_2_PP_pnum]","input[name=trpr27_FWT_3_PP_pnum]","input[name=trpr27_FWT_4_PP_pnum]","input[name=trpr27_FWT_5_PP_pnum]","input[name=trpr27_FWT_6_PP_pnum]","input[name=trpr28_FWT_0_PP_pnum]","input[name=trpr28_FWT_1_PP_pnum]","input[name=trpr28_FWT_2_PP_pnum]","input[name=trpr28_FWT_3_PP_pnum]","input[name=trpr28_FWT_4_PP_pnum]","input[name=trpr28_FWT_5_PP_pnum]","input[name=trpr28_FWT_6_PP_pnum]","input[name=trpr29_FWT_0_PP_pnum]","input[name=trpr29_FWT_1_PP_pnum]","input[name=trpr29_FWT_2_PP_pnum]","input[name=trpr29_FWT_3_PP_pnum]","input[name=trpr29_FWT_4_PP_pnum]","input[name=trpr29_FWT_5_PP_pnum]","input[name=trpr29_FWT_6_PP_pnum]","input[name=SOCSECNUMBER]","input[name=change_pwd]","input[name=pwd]","input[name=ucPayment_txtCCV2Number]","input[name=ucPassenger_txtPhoneNumberP1]","input[name=ucPayment_txtPhoneNumber]","input[name=stored_credit_card]","input[name=cvv]","input[name=creditCards\\[0\\]\\.new_card_security_code]","input[name=creditCards\\[1\\]\\.new_card_security_code]","input[name=creditCards\\[0\\]\\.card_number]","input[name=creditCards\\[1\\]\\.card_number]","input[name=phone]","input[name=storedCreditCardId]","input[name=TripPreferencesWidget_inpTravellerPreferredPhoneNumber]","input[name=card_select]","input[name=ccnum]","input[name=FOPIH_RgWebCC_0_ccnu]","input[name=FOPIH_RgWebELV_0_elva]","input[name=FOPIH_RgWebELV_0_elvb]","input[name=CardHolder_creditcardnumber]","input[name=FOPIH_RgWebCC_1_ccnu]","input[name=FOPIH_RgWebELV_1_elva]","input[name=FOPIH_RgWebELV_1_elvb]","input[name=card_number]","input[name=elv_account_number]","input[name=elv_bank_code_number]","input[name=ucPayment_txtCCNumber]","input[name=cc_num]","input[name=CREDITCARD]","input[name=creditCardNumber]","input[name=cardSecurityCode]","input[name=login\\.password]","input[name=ucPayment\\$txtCCV2Number]","input[name=ucPayment2\\$txtCCV2Number]","input[name=ucPassenger\\$txtPhoneNumberP1]","input[name=ucPayment\\$txtPhoneNumber]","input[name=ucPayment\\$txtCCNumber]","input[name=ucPayment2\\$txtCCNumber]","input[name=options\\.creditCard\\.cardNumber]","input[name=options\\.creditCard\\.newCardSecurityCode]","input[name=options\\.creditCard\\.storedSecurityCode]","input[name=signin-password]","input[name=create-account-password]","input[name=create-account-confirm-password]","input[name=cpf]","input[name=taxID_new]","input[name=taxID_stored]","input[name=retypePassword]","input[name=createPassword]","input[name=userPassword]","input[name=authenticationData\\.password]","input[name=signin-password]","input[name=userPassword]","input[name=createPassword]","input[name=retypePassword]","input[name=options\\.elv\\.ibanNumber]","input[name=giftCardNumber]","input[name=giftCardPinCode]","input[name=payments\\.submittedPayments\\[0\\]\\.billingDetailsForm\\.customerTaxPayerId]","input[name=paymentData\\.InstallmentPayment\\.TaxId]","input[name=paymentData\\.PaymentInfo\\.InstallmentPayment\\.TaxId]","input[name=newpwd1]","input[name=newpwd2]","input[name=changepassword]","input[name=newPassword]","input[name=ConfirmNewPassword]","input[name=passportNumber]","input[name=creditCards\\[0\\]\\.new_card_security_code]","input[name=creditCards\\[0\\]\\.stored_card_security_code]","input[name=creditCards\\[0\\]\\.storedCreditCardPaymentInstrumentId]","input[name=storedCreditCardPaymentInstrumentId]","input[name=payments\\.submittedPayments\\[0\\]\\.storedPayment\\.spsId]","input[name=paymentData\\.PaymentInfo\\.CreditCardPayment\\.CCV]","input[name=paymentData\\.Payment\\.CCV]","input[name=paymentData\\.PaymentInfo\\.SavedCard]"],"maskType":3}]},"serializer":{"json":{"defaultToBuiltin":true,"parsers":[],"stringifiers":[]}}},"core":{"modules":{"performance":{"enabled":true,"events":[{"name":"load","target":window},{"name":"unload","target":window}]},"replay":{"enabled":true,"events":[{"name":"load","target":window},{"name":"unload","target":window},{"name":"click","recurseFrames":true},{"name":"focus","target":"input, select, textarea","recurseFrames":true},{"name":"blur","target":"input, select, textarea","recurseFrames":true},{"name":"change","target":changeTarget,"recurseFrames":true},{"name":"resize","target":window},{"name":"scroll","target":window},{"name":"hashchange","target":window},{"name":"orientationchange","target":window},{"name":"touchend"}]}},"framesBlacklist":[".tl_block"],"sessionData":{"sessionCookieName":"TLTSID"}},"modules":{"performance":{"calculateRenderTime":true,"filter":{"navigationStart":true,"unloadEventStart":true,"unloadEventEnd":true,"redirectStart":true,"redirectEnd":true,"fetchStart":true,"domainLookupStart":true,"domainLookupEnd":true,"connectStart":true,"connectEnd":true,"secureConnectionStart":true,"requestStart":true,"responseStart":true,"responseEnd":true,"domLoading":true,"domInteractive":true,"domContentLoadedEventStart":true,"domContentLoadedEventEnd":true,"domComplete":true,"loadEventStart":true,"loadEventEnd":true}}}},collectComments);
}());

function getCommentNodes(containerNode)
{
  var comments = [];
  if(document.createTreeWalker)
  {
    var treeWalker = document.createTreeWalker(containerNode, NodeFilter.SHOW_COMMENT, { acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT; } }, false);
    while(treeWalker.nextNode()) { comments.push(treeWalker.currentNode); }
  }
  else
  {
    // IE8 or below
  }
  return comments;
} 

//document.addEventListener("beforeunload", function onDom(evt) {
function collectComments()
{
  if(TLT != "undefined")
  {
    var comments = getCommentNodes(document);
    var sz = comments.length; var current = null;
    for(var index = 0; index < sz; ++index)
    {
      current = comments[index].nodeValue;
      if(current.indexOf("tlAbacusTest") != -1)
      {
        current = current.split(":")[1];
        TLT.logCustomEvent("AbacusTest", current);
      }
    }
  }
  }

/* static_content/default/default/scripts/marketing/tracking/tealiumUdoListener.js */
function tealiumUdoListener(udo) {
    utag_data = udo;

    require(['tealium-settings'], function(settings) {
        if (typeof settings != "undefined" && settings.tealiumSafeFramesEnabled === "true") {
            require(['tealium-safeframe'], function (tsf) {
                tsf.loadUtag(utag_data);
            });
        } else {
            if (window.utag) {
                window.utag.view(utag_data);
            }
            else if (!window.utag && typeof settings != "undefined") {
                var tmsTagPath = "//tags.tiqcdn.com/utag/expedia/" + settings.tealiumProfilename + "/" + settings.tealiumEnvironment + "/utag.js"
                if (typeof $LAB === 'object' && typeof $LAB.script === 'function') {
                    $LAB.script(tmsTagPath);
                }
                else {
                    (function (a, b, c, d) {
                        a = tmsTagPath;
                        b = document;
                        c = 'script';
                        d = b.createElement(c);
                        d.src = a;
                        d.type = 'text/java' + c;
                        d.async = true;
                        a = b.getElementsByTagName(c)[0];
                        a.parentNode.insertBefore(d, a);
                    })();
                }
            }
        }
    });
}
UDOAjaxUtils.registerUDOListener(tealiumUdoListener);

/* static_content/default/default/scripts/exp/flights/flux/framePagePerformanceLogging.js */
/*jslint browser: true, unparam: true, white: true, todo: true */
/*global define, require, console */

require(['jquery', 'applicationViewLogging'], function ($, ApplicationViewLogging) {

    'use strict';

    function logFramePagePerformance() {
        var logArray,
            elem,
            framePagePerfModel;

        elem = $('#frame-page-performance-model');
        if(undefined === elem || '' === elem.text()) {
            return;
        }

        framePagePerfModel = JSON.parse(elem.text());
        if(undefined === framePagePerfModel) {
            return;
        }

        logArray = ApplicationViewLogging.buildPerfEventLogArray(framePagePerfModel.entries);
        logArray.push('totalTime=' + framePagePerfModel.totalTime);
        logArray.push('staticPage=true');
        dctk.logging.logTrxEvent('framePagePerformanceMetrics', logArray);
    }

    logFramePagePerformance();

});
/* static_content/default/default/scripts/exp/flights/flux/views/BasicEconomyView.js */
/*jslint browser: true, unparam: true, todo: true, nomen: true*/
/*global define, require, console */

define('basicEconomyView', ['jquery', 'handlebars', 'backbone'], function ($, handlebars, Backbone) {
    'use strict';

    function showBasicEconomy($basicEconomyElement, rules, self){
        self.render($basicEconomyElement, rules);
        updateSelectOmniture($basicEconomyElement, rules);
    }

    function getOmnitureSuffix (basicEconomyRules) {
        return basicEconomyRules.length > 1 ? 'Mixed' : basicEconomyRules[0].airlineCode;
    }

    function updateSelectOmniture (element, basicEconomyRules) {
        var omnitureSuffix, selectButton;
        selectButton = element.find('.t-select-btn');
        omnitureSuffix = getOmnitureSuffix(basicEconomyRules);
        selectButton.attr('data-omniture-rfrr', selectButton.attr('data-omniture-rfrr') + '.BasicEconomy.' + omnitureSuffix);
    }

    return Backbone.View.extend({
       template : handlebars.templates.basicEconomy,

       initialize: function (data){
           var self = this;
           showBasicEconomy(data.$basicEconomyElement, data.rules, self);
       },
       render : function ($basicEconomyElement, basicEconomyRules) {
           var markup,
           templateData = {
                   airlineShortName: basicEconomyRules[0].airlineName,
                   omnitureSuffix: getOmnitureSuffix(basicEconomyRules),
                   rules: basicEconomyRules[0].ruleLocIds
           };
           markup = this.template(templateData);
           $basicEconomyElement.append(markup);
           $basicEconomyElement.removeClass('hide');
           $basicEconomyElement.parent().removeClass('hide');
       }
    });
});
