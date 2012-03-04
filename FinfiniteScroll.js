/*
Fergal Hainey's tumblr infinite scroll script

https://github.com/Riprock/ferhai.tumblr.com-theme
*/
(function() {
	var evalScripts = function(element) {
		var scripts = element.getElementsByTagName('script');
		for (var j = 0; j < scripts.length; j++) {
			var newScript = document.createElement('script');
			if (scripts[j].src) newScript.src = scripts[j].src;
			newScript.innerHTML = scripts[j].innerHTML;
			scripts[j].parentNode.removeChild(scripts[j]);
			document.head.appendChild(newScript);
			newScript.addEventListener('load', function(event) {
				evalScripts(element);
				this.removeEventListener('load', arguments.callee);
			});
		}
	};
	var getCommonAncestor = function(elements) {
		// Assumes elements are in getElementsByTagName order
		var i = 1;
		while (elements[0].contains(elements[i])) {
			i++;
		}
		var parent1 = elements[0].parentNode;
		var parent2 = elements[i].parentNode;
		while (parent1 != parent2) {
			parent1 = parent1.parentNode;
			parent2 = parent2.parentNode;
		}
		return parent1;
	}
	var page = (new RegExp('/page/([^/]*)')).exec(window.location.pathname);
	page = page ? parseInt(page[1]) + 1 : 2;
	var tagged = (new RegExp('/tagged/([^/]*)')).exec(window.location.pathname);
	tagged = tagged ? tagged[1] : '';
	var classRegex;
	var postsParent;
	var doingPage;
	var weAreDone;
	window.addEventListener('scroll', function(event) {
		if (
			window.pageYOffset + window.innerHeight * 3 >= document.documentElement.scrollHeight
			&& doingPage != page
		) {
			if (!weAreDone) {
				var request = new XMLHttpRequest;
				request.onreadystatechange = function() {
					if (request.readyState == 4) {
						if (request.status == 200) {
							// FinfiniteScrollPostClass can be set in another script
							if (!window['FinfiniteScrollPostClass']) {
								var classes = ['post', 'POST', 'entry', 'ENTRY'];
								for (var i = 0; i < classes.length; i++) {
									if (document.getElementsByClassName(classes[i]).length > 1) {
										FinfiniteScrollPostClass = classes[i];
										classRegex = new RegExp('\b' + FinfiniteScrollPostClass + '\b');
										break;
									}
								}
							}
							if (!postsParent) {
								postsParent = getCommonAncestor(document.getElementsByClassName(FinfiniteScrollPostClass));
							}
							var tempDiv = document.createElement('div');
							tempDiv.innerHTML = request.responseText;
							var moreContent;
							try {
								// getCommonAncestor throws if there is only one post
								// Using parent children to get guff like separators too
								moreContent = getCommonAncestor(tempDiv.getElementsByClassName(FinfiniteScrollPostClass)).children;
							}
							catch (error) {
								// This could end up with just an array of undefined
								moreContent = [tempDiv.getElementsByClassName(FinfiniteScrollPostClass)[0]];
							}
							if (!moreContent[0]) {
								weAreDone = true;
								return;
							}
							// HTMLCollections are not arrays, they are live
							var moreContentLength = moreContent.length;
							for (var i = 0; i < moreContentLength; i++) {
								var element = moreContent[0]
								postsParent.appendChild(element);
								evalScripts(element);
							}
							page++;
						}
						else {
							weAreDone = true;
						}
					}
				};
				request.open('GET', window.location.origin + '/tagged/' + tagged + '/page/' + page);
				request.send();
				doingPage = page;
			}
			else {
				window.removeEventListener('scroll', arguments.callee);
			}
		}
	})
})();
