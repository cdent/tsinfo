$(function() {
	/*
	 * Get info about recently created tiddlers.
	 */
	var newestSpace =
		'/search?q=title:SiteInfo%20_limit:99;sort=-created;limit=1',
		newSpaces = '/search?q=title:SiteInfo%20modified:$TODAY$*%20_limit:99;select=created:>$TODAY$';

	$.ajaxSetup({
		beforeSend: function(xhr) {
						xhr.setRequestHeader("X-ControlView", "false");
					}
	});

	function failAjax(jqXHR, textStatus, errorThrown) {
		console.error(jqXHR, textStatus, errorThrown);
	}

	function showTiddlerCount(data, status, jqXHR) {
		var count = data.length,
			space;
		if (count > 0) {
			space = data[0].bag;
		} else {
			// space = parseduri;
		}
		graphData.push({space: space.replace(/_public$/, ''),
			count: count})
		render();
	}

	function countTiddlers(bag) {
		var tiddlerURI = '/bags/' + encodeURIComponent(bag) + '/tiddlers';
		$.ajax({
			dataType: 'json',
			url: tiddlerURI})
		.done(showTiddlerCount)
		.fail(failAjax);
	}

	function handleCreated(data) {
		if (data.length === 0) {
			failAjax(null, 'data wrong length');
		} else {
			$.each(data, function(index, tiddler) {
				countTiddlers(tiddler.bag);
			});
		}
	}

	function previousDay(day) {
		// make this real
		var yesterday = '' + day - 1 + '';
		console.log('yest', yesterday);
		return yesterday;
	}

	function handleToday(data) {
		console.log('data', data);
		if (data.length === 1) {
			var today = data[0].created.substr(0,8),
				createdToday = newSpaces.replace(/\$TODAY\$/g, today);
				yesterday = previousDay(today);

			$.ajax({
				dataType: 'json',
				url: createdToday})
			.done(handleCreated)
			.fail(failAjax);
			$('.date').text(today);
			$('.date').append('<p><a href="#' + yesterday +'">'
					+ yesterday +'</a></p>');
		} else {
			failAjax(null, 'data wrong length');
		}
	}

	function getToday() {
		var dateHash = window.location.hash;
		if (dateHash) {
			dateHash = dateHash.replace(/^#/, '');
			dateHash = [{created: dateHash}];
			handleToday(dateHash);
		} else {
			$.ajax({
				dataType: 'json',
				url: newestSpace})
			.done(handleToday)
			.fail(failAjax);
		}
	}

	function newChart() {
		graphData = [];
		d3.select('article').select('svg').remove();
		return d3.select('article').append('svg')
			.attr("class", "chart")
			.attr("width", width)
			.attr("height", height);
	}

	var graphData,
		height = 500,
		width = 800,
		barWidth = 20,
		chart = newChart();
		
	function render() {
		var dataPoints = chart.selectAll("rect")
			.data(graphData, function(item) {return item.space });
		var enterator = dataPoints.enter();
		enterator.append("rect")
			.attr("x", 175)
			.attr("y", function(d, i) {return i * barWidth})
			.attr("width", function(d) {return d.count * 5})
			.attr("height", barWidth)
			.append("title")
			.text(function(d) {return d.space + ' ' + d.count});
		enterator.append("text")
			.attr("x", 175)
			.attr("y", function(d, i) {return i * barWidth})
			.attr("text-anchor", "end")
			.attr("dx", "-.5em")
			.attr("dy", (barWidth - 3))
			.text(function(d) { return d.space + ' ' + d.count });
	}

	$(window).on('hashchange', function() {
		var data = window.location.hash.replace(/^#/, '');
		data = [{created: data}];
		chart = newChart();
		handleToday(data);
		return false;
	});

	getToday();
});
