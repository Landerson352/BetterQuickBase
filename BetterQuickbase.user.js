// ==UserScript==
// @name         Better Quickbase
// @namespace    BrokenLinc
// @include      http://*.quickbase.com/*
// @include      https://*.quickbase.com/*
// @author       Lincoln Anderson
// @description  Make timecards less painful!
// ==/UserScript==

// a function that loads jQuery and calls a callback function when jQuery has finished loading
function addJQuery(callback) {
	var script = document.createElement("script");
	script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js");
	script.addEventListener('load', function() {
		var script = document.createElement("script");
		script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
		document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}

// the guts of this userscript
// packaged in a closure so it can be toStringed
var onScriptLoad = function() {
	var $;

	function init() {
		$ = jQ;

		//I decided to map to page titles instead of cryptic URLs, seems less fragile. Time will tell.
		var pageTitle = $('#headerDetailPageTitle').text();
		var pageFunctionsByTitle = {
			'Add Time Card': setupPage_AddTimeCard
		}

		pageFunctionsByTitle[pageTitle]();
	}

	function sync_element_with_localStorage(id) {
		if(localStorage[id]) $('#'+id).val(localStorage[id]);
		$('#'+id).one('change blur keyup', function(e){
			//console.log($(this).val());
			localStorage[$(this).attr('id')] = $(this).val();
		});
	}

	function supports_html5_storage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}

	/******************************
		PAGE METHODS
	******************************/

	function setupPage_AddTimeCard() {

        if(supports_html5_storage()) {
            //skim prepopulated value
			var today = $('#_fid_6').val();

        	//onLoad/onChange Binding
            sync_element_with_localStorage('_fid_25'); //Project
            sync_element_with_localStorage('_fid_6'); //Date
            sync_element_with_localStorage('_fid_8'); //Summary
            $('#ui-datepicker-div').on('click', function(){ //Datepicker, doesn't trigger anything
				//console.log($('#_fid_6').val());
				localStorage['_fid_6'] = $('#_fid_6').val();
            });

            //Hide useless crap
            $('#tdl_5, #tdl_8, #tdl_11').hide(); //Team Member, RelatedPorject2, Task
            $('label[for="_fid_26"]').text('Project'); //Chill
            $('label[for="_fid_6"]').text('Date'); //Oh, timecards, is that what we're doing?
            $('label[for="_fid_7"]').text('Days'); //Remove OBNOXIOUS label for IDIOTS
            $('label[for="_fid_8"]').text('Summary'); //Don't rush me bro
            $('.rqrd').hide(); //Yes, it's all required.

            //Alignment
            $('#_fid_7').css({'min-width':'80px'});
            $('#_fid_8, #_fid_25').css({'width': '380px'});

            //expand sections and remove accordions
            $('#sect_s2Header, #sect_s4Header').each(function(){
            	$(this).hide().next().hide().next().show();
            });

            //Give shortcut to revert date to "today"
            $('.datepicker').after('<a href="javascript:void(0);" class="js-today">Today ('+today+')</a>');
            $(document).on('click', '.js-today', function(){
            	$('#_fid_6').val(today).trigger('change');
            });

            //Could be dangerous, holding off for now
            //Automatically set the summary to "PTO" when the PTO project is selected
            // $('#_fid_25').on('change', function(){
            // 	if($(this).val()==50) { //PTO Project ID
            // 		$('#_fid_8').val('PTO').trigger('change');
            // 	}
            // });

            //Suggested Summaries (click to input)
            var suggestions = [
            	'Sprint Planning', 
            	'Sprint Development', 
            	'Sprint Closeout', 
            	'PTO'
            ];
            var personalSummaries = localStorage['personalSummaries']? localStorage['personalSummaries'].split('|') : [];
            var $menu = $('<div style="max-width:380px;white-space:normal;line-height:1.5em;"/>')
            	.on('click', 'a', function() {
	                $('#_fid_8').val($(this).text()).trigger('change');
	            });
            $('#_fid_8').after($menu);
            function renderSuggestions(){
	            var suggestionLinks = [];
	            $.each(suggestions, function(i, item) {
					suggestionLinks.push('<a href="javascript:void(0);">'+item+'</a>');
	            });
	            $.each(personalSummaries, function(i, item) {
					suggestionLinks.push('<a href="javascript:void(0);">'+item+'</a>');
	            });
	            $menu.html('Quick fill: '+suggestionLinks.join(', '));
            }
            renderSuggestions();

            //Allow custom summary input
            $menu.after('<div style="margin:0.5em 0;"><input style="width:380px;" type="text" class="js-newsuggestion" placeholder="add a new custom quick fill"/></div>');
            $(document).on('keypress', '.js-newsuggestion', function(e){
            	if(e.which === 13) {
            		personalSummaries.push($(this).val());
            		localStorage['personalSummaries'] = personalSummaries.join('|');
            		renderSuggestions();
            		$(this).val(null);
            	}
            });
        }
	}

	init();
}

// load jQuery and execute the main function
addJQuery(onScriptLoad);