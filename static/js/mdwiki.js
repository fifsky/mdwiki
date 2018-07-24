(function($) {
    'use strict';

    // hide the whole page so we dont see the DOM flickering
    // will be shown upon page load complete or error
    $('html').addClass('md-hidden-load');

    // register our $.md object
    $.md = function (method){
        if ($.md.publicMethods[method]) {
            return $.md.publicMethods[method].apply(this,
                Array.prototype.slice.call(arguments, 1)
            );
        } else {
            $.error('Method ' + method + ' does not exist on jquery.md');
        }
    };
    // default config
    $.md.config = {
        title:  null,
        useSideMenu: true,
        lineBreaks: 'gfm'
    };

    // the location of the main markdown file we display
    $.md.mainHref = '';

    // the in-page anchor that is specified after the !
    $.md.inPageAnchor = '';

}(jQuery));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MDwiki;
(function (MDwiki) {
    (function (Core) {
        var ScriptResource = (function () {
            function ScriptResource(url, loadstage, finishstage) {
                if (typeof loadstage === "undefined") { loadstage = 'skel_ready'; }
                if (typeof finishstage === "undefined") { finishstage = 'gimmick'; }
                this.url = url;
                this.loadstage = loadstage;
                this.finishstage = finishstage;
            }
            return ScriptResource;
        })();
        Core.ScriptResource = ScriptResource;

        var CssResource = (function () {
            function CssResource(url, finishstage) {
                if (typeof finishstage === "undefined") { finishstage = 'gimmick'; }
                this.url = url;
                this.finishstage = finishstage;
            }
            return CssResource;
        })();
        Core.CssResource = CssResource;

        var GimmickLinkParts = (function () {
            function GimmickLinkParts(trigger, options, href) {
                this.trigger = trigger;
                this.options = options;
                this.href = href;
            }
            return GimmickLinkParts;
        })();

        var GimmickHandler = (function () {
            function GimmickHandler(trigger, handler, loadstage) {
                if (typeof loadstage === "undefined") { loadstage = 'gimmick'; }
                this.trigger = trigger;
                this.handler = handler;
                this.loadstage = loadstage;
            }
            return GimmickHandler;
        })();
        Core.GimmickHandler = GimmickHandler;

        var Module = (function () {
            function Module() {
            }
            Module.prototype.init = function () {
            };

            Module.prototype.registerScriptResource = function (res) {
                var loadDone = $.Deferred();

                $.md.stage(res.loadstage).subscribe(function (done) {
                    if (res.url.startsWith('//') || res.url.startsWith('http')) {
                        $.getScript(res.url, function () {
                            return loadDone.resolve();
                        });
                    } else {
                        var script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.text = res.url;
                        document.body.appendChild(script);
                        loadDone.resolve();
                    }
                    done();
                });

                $.md.stage(res.finishstage).subscribe(function (done) {
                    loadDone.done(function () {
                        return done();
                    });
                });
            };
            Module.prototype.registerCssResource = function (resource) {
            };
            return Module;
        })();
        Core.Module = Module;

        var Gimmick = (function (_super) {
            __extends(Gimmick, _super);
            function Gimmick() {
                _super.apply(this, arguments);
                this.Handlers = [];
            }
            Gimmick.prototype.init = function () {
            };
            Gimmick.prototype.addHandler = function (trigger, cb, loadstage) {
                if (typeof loadstage === "undefined") { loadstage = 'gimmick'; }
                var handler = new GimmickHandler(trigger, cb, loadstage);
                this.Handlers.push(handler);
            };
            return Gimmick;
        })(Module);
        Core.Gimmick = Gimmick;

        function getGimmickLinkParts($link) {
            var link_text = $.trim($link.toptext());

            if (link_text.match(/gimmick:/i) === null) {
                return null;
            }
            var href = $.trim($link.attr('href'));
            var r = /gimmick\s?:\s*([^(\s]*)\s*\(?\s*{?(.*)\s*}?\)?/i;
            var matches = r.exec(link_text);
            if (matches === null || matches[1] === undefined) {
                $.error('Error matching a gimmick: ' + link_text);
                return null;
            }
            var trigger = matches[1].toLowerCase();
            var args = null;

            if (matches[2].toLowerCase().indexOf("gimmick") != 0) {
                var params = $.trim(matches[2].toString());
                if (params.charAt(params.length - 1) === ')') {
                    params = params.substring(0, params.length - 1);
                }

                if (params.charAt(params.length - 1) === '}') {
                    params = params.substring(0, params.length - 1);
                }

                params = '({' + params + '})';

                var replace_quotes = new RegExp("'", 'g');
                params = params.replace(replace_quotes, '"');

                try  {
                    args = eval(params);
                } catch (err) {
                    $.error('error parsing argument of gimmick: ' + link_text + 'giving error: ' + err);
                }
            }
            return new GimmickLinkParts(trigger, args, href);
        }

        var GimmickLoader = (function () {
            function GimmickLoader() {
                this.registeredModules = [];
                this.requiredGimmicks = [];
                this.gimmicks = [];
            }
            GimmickLoader.prototype.initModules = function () {
                this.registeredModules.map(function (m) {
                    return m.init();
                });
            };
            GimmickLoader.prototype.registerModule = function (mod) {
                this.registeredModules.push(mod);
            };
            GimmickLoader.prototype.registerGimmick = function (gmck) {
                this.gimmicks.push(gmck);
            };

            GimmickLoader.prototype.initGimmicks = function () {
                var _this = this;
                var $gimmick_links = $('a:icontains(gimmick:)');
                $gimmick_links.map(function (i, e) {
                    var $link = $(e);
                    var parts = getGimmickLinkParts($link);
                    if (_this.requiredGimmicks.indexOf(parts.trigger) < 0)
                        _this.requiredGimmicks.push(parts.trigger);
                });
                this.requiredGimmicks.map(function (trigger) {
                    var gmck = _this.selectGimmick(trigger);

                    gmck.init();
                });
            };

            GimmickLoader.prototype.loadGimmicks = function () {
                var _this = this;
                var $gimmick_links = $('a:icontains(gimmick:)');
                $gimmick_links.map(function (i, e) {
                    var $link = $(e);
                    var parts = getGimmickLinkParts($link);
                    var handler = _this.selectGimmickHandler(parts.trigger);
                    $.md.stage(handler.loadstage).subscribe(function (done) {
                        handler.handler($link, parts.options, $link.attr('href'));
                        done();
                    });
                });
            };
            GimmickLoader.prototype.selectGimmick = function (trigger) {
                var gimmicks = this.gimmicks.filter(function (g) {
                    var triggers = g.Handlers.map(function (h) {
                        return h.trigger;
                    });
                    if (triggers.indexOf(trigger) >= 0)
                        return true;
                });
                return gimmicks[0];
            };
            GimmickLoader.prototype.selectGimmickHandler = function (trigger) {
                var gimmick = this.selectGimmick(trigger);
                var handler = gimmick.Handlers.filter(function (h) {
                    return h.trigger == trigger;
                })[0];
                return handler;
            };
            GimmickLoader.prototype.findActiveLinkTrigger = function () {
                var activeLinkTriggers = [];

                var $gimmicks = $('a:icontains(gimmick:)');
                $gimmicks.each(function (i, e) {
                    var parts = getGimmickLinkParts($(e));
                    if (activeLinkTriggers.indexOf(parts.trigger) === -1)
                        activeLinkTriggers.push(parts.trigger);
                });
                return activeLinkTriggers;
            };
            return GimmickLoader;
        })();
        Core.GimmickLoader = GimmickLoader;
    })(MDwiki.Core || (MDwiki.Core = {}));
    var Core = MDwiki.Core;
})(MDwiki || (MDwiki = {}));
var MDwiki;
(function (MDwiki) {
    (function (Util) {
        (function (LogLevel) {
            LogLevel[LogLevel["TRACE"] = 0] = "TRACE";
            LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
            LogLevel[LogLevel["INFO"] = 2] = "INFO";
            LogLevel[LogLevel["WARN"] = 3] = "WARN";
            LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
            LogLevel[LogLevel["FATAL"] = 5] = "FATAL";
        })(Util.LogLevel || (Util.LogLevel = {}));
        var LogLevel = Util.LogLevel;
        var Logger = (function () {
            function Logger(level) {
                this.logLevel = 4 /* ERROR */;
                this.logLevel = level;
            }
            Logger.prototype.log = function (loglevel, msg) {
                console.log('[' + loglevel.toUpperCase() + '] ' + msg);
            };
            Logger.prototype.trace = function (msg) {
                if (this.logLevel >= 0 /* TRACE */)
                    this.log('TRACE', msg);
            };
            Logger.prototype.info = function (msg) {
                if (this.logLevel >= 2 /* INFO */)
                    this.log('INFO', msg);
            };
            Logger.prototype.debug = function (msg) {
                if (this.logLevel >= 1 /* DEBUG */)
                    this.log('DEBUG', msg);
            };
            Logger.prototype.warn = function (msg) {
                if (this.logLevel >= 3 /* WARN */)
                    this.log('WARN', msg);
            };
            Logger.prototype.error = function (msg) {
                if (this.logLevel >= 4 /* ERROR */)
                    this.log('ERROR', msg);
            };
            Logger.prototype.fatal = function (msg) {
                if (this.logLevel >= 5 /* FATAL */)
                    this.log('FATAL', msg);
            };
            return Logger;
        })();
        Util.Logger = Logger;
    })(MDwiki.Util || (MDwiki.Util = {}));
    var Util = MDwiki.Util;
})(MDwiki || (MDwiki = {}));
(function ($) {
    var logger;
    if (MDwikiEnableDebug)
        logger = new MDwiki.Util.Logger(1 /* DEBUG */);
    else
        logger = new MDwiki.Util.Logger(4 /* ERROR */);

    $.md.getLogger = function () {
        return logger;
    };

    $.initMDwiki = function (name) {
        $.md.wiki = new MDwiki.Core.Wiki();
        $.md.stage = function (name) {
            return $.md.wiki.stages.getStage(name);
        };
    };
}(jQuery));
var Markdown = (function () {
    function Markdown(markdownSource, options) {
        if (typeof options === "undefined") { options = {}; }
        this.defaultOptions = {
            gfm: true,
            tables: true,
            breaks: true
        };
        this.markdownSource = markdownSource;
        this.options = options;
    }
    Markdown.prototype.transform = function () {
        marked.setOptions(this.options);
        var uglyHtml = marked(this.markdownSource);
        return uglyHtml;
    };
    return Markdown;
})();

var Navbar = (function () {
    function Navbar(navbarMarkdown) {
        this.navbarMarkdown = navbarMarkdown;
        var md = new Markdown(navbarMarkdown);
        this.uglyHtml = md.transform();
    }
    Navbar.prototype.render = function () {
        var h = $('<div>' + this.uglyHtml + '</div>');

        h.find('p').each(function (i, e) {
            var el = $(e);
            el.replaceWith(el.html());
        });
        $('#md-menu').append(h.html());
    };
    Navbar.prototype.hideIfHasNoLinks = function () {
        var num_links = $('#md-menu a').length;
        var has_header = $('#md-menu .navbar-brand').eq(0).toptext().trim().length > 0;
        if (!has_header && num_links <= 1)
            $('#md-menu').hide();
    };
    return Navbar;
})();
var MDwiki;
(function (MDwiki) {
    (function (Core) {
        var Resource = (function () {
            function Resource(url, dataType) {
                if (typeof dataType === "undefined") { dataType = 'text'; }
                this.url = url;
                this.dataType = dataType;
            }
            Resource.fetch = function (url, dataType) {
                if (typeof dataType === "undefined") { dataType = 'text'; }
                var jqxhr = $.ajax({
                    url: url,
                    dataType: dataType
                });
                return jqxhr;
            };
            return Resource;
        })();
        Core.Resource = Resource;

        var StageChain = (function () {
            function StageChain() {
                this.stages = [];
            }
            StageChain.prototype.reset = function () {
                var new_stages = [];
                for (var i = 0; i < this.stages.length; i++) {
                    var name = this.stages[i].name;
                    new_stages.push(new Stage(name));
                }
            };
            StageChain.prototype.appendArray = function (st) {
                var _this = this;
                st.map(function (s) {
                    return _this.append(s);
                });
            };
            StageChain.prototype.append = function (s) {
                var len = this.stages.length;
                if (len == 0) {
                    this.stages.push(s);
                    return;
                }
                var last = this.stages[len - 1];
                last.finished().done(function () {
                    return s.start();
                });
                this.stages.push(s);
            };
            StageChain.prototype.run = function () {
                this.stages[0].start();
            };

            StageChain.prototype.getStage = function (name) {
                return this.stages.filter(function (s) {
                    return s.name == name;
                })[0];
            };
            return StageChain;
        })();
        Core.StageChain = StageChain;

        var Stage = (function () {
            function Stage(name) {
                this.started = false;
                this.subscribedFuncs = [];
                this.allFinishedDfd = $.Deferred();
                this.name = name;
            }
            Stage.prototype.finished = function () {
                return this.allFinishedDfd;
            };

            Stage.prototype.subscribe = function (fn) {
                if (this.started)
                    throw 'Stage already started';

                this.subscribedFuncs.push(fn);
            };

            Stage.prototype.start = function () {
                var _this = this;
                console.dir("running stage " + this.name);
                this.started = true;
                var num_outstanding = this.subscribedFuncs.length;

                if (num_outstanding == 0) {
                    this.allFinishedDfd.resolve();
                    return;
                }

                this.subscribedFuncs.map(function (subbedFn) {
                    var doneCallback = function () {
                        --num_outstanding || _this.allFinishedDfd.resolve();
                    };
                    subbedFn(doneCallback);
                });
            };
            return Stage;
        })();
        Core.Stage = Stage;
    })(MDwiki.Core || (MDwiki.Core = {}));
    var Core = MDwiki.Core;
})(MDwiki || (MDwiki = {}));

var Logger = MDwiki.Util.Logger;

var MDwiki;
(function (MDwiki) {
    (function (Core) {
        var Wiki = (function () {
            function Wiki() {
                var _this = this;
                this.stages = new MDwiki.Core.StageChain();
                this.gimmicks = new MDwiki.Core.GimmickLoader();
                var stage_names = ([
                    'init', 'load', 'transform', 'ready', 'skel_ready',
                    'bootstrap', 'pregimmick', 'gimmick', 'postgimmick', 'all_ready',
                    'final_tests'
                ]);
                stage_names.map(function (n) {
                    return _this.stages.append(new MDwiki.Core.Stage(n));
                });
            }
            Wiki.prototype.run = function () {
                this.registerFetchConfigAndNavigation();
                this.registerFetchMarkdown();
                this.registerPageTransformation();
                this.registerGimmickLoad();
                this.registerClearContent();
                this.registerFinalTasks();

                this.stages.run();
            };
            Wiki.prototype.registerFetchConfigAndNavigation = function () {
                var _this = this;
                $.md.stage('init').subscribe(function (done) {
                    $.when(MDwiki.Core.Resource.fetch('config.json'), MDwiki.Core.Resource.fetch('content/navigation.md')).then(function (config, nav) {
                        var data_json = JSON.parse(config[0]);

                        $.md.config = $.extend($.md.config, data_json);

                        _this.registerBuildNavigation(nav[0]);
                        done();
                    });
                });
            };
            Wiki.prototype.registerPageTransformation = function () {
                $.md.stage('ready').subscribe(function (done) {
                    $.md('createBasicSkeleton');
                    done();
                });

                $.md.stage('bootstrap').subscribe(function (done) {
                    $.mdbootstrap('bootstrapify');
                    $.md.processPageLinks($('#md-content'), $.md.baseUrl);
                    done();
                });
            };

            Wiki.prototype.transformMarkdown = function (markdown) {
                var options = {
                    gfm: true,
                    tables: true,
                    breaks: true
                };
                if ($.md.config.lineBreaks === 'original')
                    options.breaks = false;
                else if ($.md.config.lineBreaks === 'gfm')
                    options.breaks = true;

                marked.setOptions(options);

                var uglyHtml = marked(markdown);
                return uglyHtml;
            };

            Wiki.prototype.registerClearContent = function () {
                $.md.stage('init').subscribe(function (done) {
                    $('#md-all').empty();
                    var skel = '<div id="md-body"><div id="md-title"></div><div id="md-menu">' + '</div><div id="md-content"></div></div>';
                    $('#md-all').prepend($(skel));
                    done();
                });
            };
            Wiki.prototype.registerFetchMarkdown = function () {
                var _this = this;
                var md = '';
                $.md.stage('init').subscribe(function (done) {
                    var ajaxReq = {
                        url: 'content/'+$.md.mainHref,
                        dataType: 'text'
                    };
                    $.ajax(ajaxReq).done(function (data) {
                        md = data;
                        done();
                    }).fail(function () {
                        var log = $.md.getLogger();
                        log.fatal('Could not get ' + $.md.mainHref);
                        done();
                        $('#md-content').html('<div id="defaults-change-alert" class="alert alert-warning alert-dismissible" role="alert"> <strong>404!</strong> <code>'+$.md.mainHref+'</code> 文件不存在.</div>');
                    });
                });

                $.md.stage('transform').subscribe(function (done) {
                    var len = $.md.mainHref.lastIndexOf('/');
                    var baseUrl = $.md.mainHref.substring(0, len + 1);
                    $.md.baseUrl = baseUrl;
                    done();
                });

                $.md.stage('transform').subscribe(function (done) {
                    var uglyHtml = _this.transformMarkdown(md);
                    $('#md-content').html(uglyHtml);
                    md = '';
                    done();
                });
            };

            Wiki.prototype.registerGimmickLoad = function () {
                var _this = this;
                $.md.stage('ready').subscribe(function (done) {
                    _this.gimmicks.initModules();
                    _this.gimmicks.initGimmicks();
                    _this.gimmicks.loadGimmicks();
                    done();
                });
            };
            Wiki.prototype.registerBuildNavigation = function (navMD) {
                $.md.stage('transform').subscribe(function (done) {
                    if (navMD === '') {
                        var log = $.md.getLogger();
                        log.info('no navgiation.md found, not using a navbar');
                        done();
                        return;
                    }
                    var navHtml = marked(navMD);
                    var h = $('<div>' + navHtml + '</div>');

                    h.find('br').remove();
                    h.find('p').each(function (i, e) {
                        var el = $(e);
                        el.replaceWith(el.html());
                    });
                    $('#md-menu').append(h.html());
                    done();
                });

                $.md.stage('bootstrap').subscribe(function (done) {
                    $.md.processPageLinks($('#md-menu'));
                    done();
                });

                $.md.stage('postgimmick').subscribe(function (done) {
                    done();
                });
            };

            Wiki.prototype.registerFinalTasks = function () {
                $.md.stage('all_ready').finished().done(function () {
                    $('html').removeClass('md-hidden-load');

                    if (typeof window['callPhantom'] === 'function') {
                        window['callPhantom']({});
                    }
                });
                $.md.stage('final_tests').finished().done(function () {
                    $('body').append('<span id="start-tests"></span>');
                    $('#start-tests').hide();
                });
            };
            return Wiki;
        })();
        Core.Wiki = Wiki;
    })(MDwiki.Core || (MDwiki.Core = {}));
    var Core = MDwiki.Core;
})(MDwiki || (MDwiki = {}));

(function($) {
    'use strict';

    // modify internal links so we load them through our engine
    $.md.processPageLinks = function (domElement, baseUrl) {
        var html = $(domElement);
        if (baseUrl === undefined) {
            baseUrl = '';
        }
        // HACK against marked: empty links will have empy href attribute
        // we remove the href attribute from the a tag
        html.find('a').not('#md-menu a').filter(function () {
            var $this = $(this);
            var attr = $this.attr('href');
            if (!attr || attr.length === 0)
                $this.removeAttr('href');
        });

        html.find('a, img').each(function(i,e) {
            var link = $(e);
            // link must be jquery collection
            var isImage = false;
            var hrefAttribute = 'href';

            if (!link.attr(hrefAttribute)) {
                isImage = true;
                hrefAttribute = 'src';
            }
            var href = link.attr(hrefAttribute);

            if (href && href.lastIndexOf ('#!') >= 0)
                return;

            if (!isImage && href.startsWith ('#') && !href.startsWith('#!')) {
                // in-page link
                link.click(function(ev) {
                    ev.preventDefault();
                    $.md.scrollToInPageAnchor (href);
                });
            }

            if (! $.md.util.isRelativeUrl(href))
                return;

            if (isImage && ! $.md.util.isRelativePath(href))
                return;

            if (!isImage && $.md.util.isGimmickLink(link))
                return;

            function build_link (url) {
                if ($.md.util.hasMarkdownFileExtension (url))
                    return '#!' + url;
                else
                    return url;
            }

            var newHref = baseUrl + href;
            if (isImage)
                link.attr(hrefAttribute, newHref);
            else if ($.md.util.isRelativePath (href))
                link.attr(hrefAttribute, build_link(newHref));
            else
                link.attr(hrefAttribute, build_link(href));
        });
    };




    function extractHashData() {
        // first char is the # or #!
        var href;
        if (window.location.hash.startsWith('#!')) {
            href = window.location.hash.substring(2);
        } else {
            href = window.location.hash.substring(1);
        }
        href = decodeURIComponent(href);

        // extract possible in-page anchor
        var ex_pos = href.indexOf('#');
        if (ex_pos !== -1) {
            $.md.inPageAnchor = href.substring(ex_pos + 1);
            $.md.mainHref = href.substring(0, ex_pos);
        } else {
            $.md.mainHref = href;
        }
    }

    function appendDefaultFilenameToHash () {
        var newHashString = '';
        var currentHashString = window.location.hash || '';
        if (currentHashString === '' ||
            currentHashString === '#'||
            currentHashString === '#!')
        {
            newHashString = '#!index.md';
        }
        else if (currentHashString.startsWith ('#!') &&
                 currentHashString.endsWith('/')
                ) {
            newHashString = currentHashString + 'index.md';
        }
        if (newHashString)
            window.location.hash = newHashString;
    }

    $.initMDwiki();

    $(document).ready(function () {

        // stage init stuff

        extractHashData();

        appendDefaultFilenameToHash();

        $(window).bind('hashchange', function () {
            window.location.reload(false);
        });

        $.md.wiki.run();
    });
}(jQuery));

(function($) {
    var publicMethods = {
        isRelativeUrl: function(url) {
            if (url === undefined) {
                return false;
            }
            // if there is :// in it, its considered absolute
            // else its relative
            if (url.indexOf('://') === -1) {
                return true;
            } else {
                return false;
            }
        },
        isRelativePath: function(path) {
            if (path === undefined)
                return false;
            if (path.startsWith('/'))
                return false;
            return true;
        },
        isGimmickLink: function(domAnchor) {
            if (domAnchor.toptext().indexOf ('gimmick:') !== -1) {
                return true;
            } else {
                return false;
            }
        },
        hasMarkdownFileExtension: function (str) {
            var markdownExtensions = [ '.md', '.markdown', '.mdown' ];
            var result = false;
            var value = str.toLowerCase().split('#')[0];
            $(markdownExtensions).each(function (i,ext) {
                if (value.toLowerCase().endsWith (ext)) {
                    result = true;
                }
            });
            return result;
        },
        wait: function(time) {
            return $.Deferred(function(dfd) {
                setTimeout(dfd.resolve, time);
            });
        }
    };
    $.md.util = $.extend ({}, $.md.util, publicMethods);

    // turns hostname/path links into http://hostname/path links
    // we need to do this because if accessed by file:///, we need a different
    // transport scheme for external resources (like http://)
    $.md.prepareLink = function(link, options) {
        options = options || {};
        var ownProtocol = window.location.protocol;

        if (options.forceSSL)
            return 'https://' + link;
        if (options.forceHTTP)
            return 'http://' + link;

        if (ownProtocol === 'file:') {
            return 'http://' + link;
        }
        // default: use the same as origin resource
        return '//' + link;
    };

    if (typeof String.prototype.startsWith !== 'function') {
        String.prototype.startsWith = function(str) {
            return this.slice(0, str.length) === str;
        };
    }
    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function(str) {
            return this.slice(this.length - str.length, this.length) === str;
        };
    }

    $.fn.extend ({
        toptext: function () {
            return this.clone().children().remove().end().text();
        }
    });

    // adds a :icontains selector to jQuery that is case insensitive
    $.expr[':'].icontains = $.expr.createPseudo(function(arg) {
        return function(elem) {
            return $(elem).toptext().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });

    $.md.util.getInpageAnchorText = function (text) {
        var subhash = text.replace(/ /g, '_');
        // TODO remove more unwanted characters like ?/,- etc.
        return subhash;

    };
    $.md.util.getInpageAnchorHref = function (text, href) {
        href = href || $.md.mainHref;
        var subhash = $.md.util.getInpageAnchorText(text);
        return '#!' + href + '#' + subhash;
    };

    // a count-down latch as in Java7.
    $.md.util.countDownLatch = function (capacity, min) {
        min = min || 0;
        var dfd = $.Deferred();
        if (capacity <= min) dfd.resolve();
        dfd.capacity = capacity;
        dfd.countDown = function () {
            dfd.capacity--;
            if (dfd.capacity <= min)
                dfd.resolve();
        };
        return dfd;
    };

}(jQuery));

(function($) {
    var publicMethods = {
        createBasicSkeleton: function() {

            setPageTitle();
            wrapParagraphText();
            linkImagesToSelf();
            groupImages();
            removeBreaks();
            addInpageAnchors ();

            $.md.stage('all_ready').subscribe(function(done) {
                if ($.md.inPageAnchor !== '') {
                    $.md.util.wait(500).then(function () {
                        $.md.scrollToInPageAnchor($.md.inPageAnchor);
                    });
                }
                done();
            });
            return;

        }
    };
    $.md.publicMethods = $.extend ({}, $.md.publicMethods, publicMethods);

    // set the page title to the browser document title, optionally picking
    // the first h1 element as title if no title is given
    function setPageTitle() {
        var $pageTitle;
        if ($.md.config.title)
            $('title').text($.md.config.title);

        $pageTitle = $('#md-content h1').eq(0);
        if ($.trim($pageTitle.toptext()).length > 0) {
            $('#md-title').prepend($pageTitle);
            var title = $pageTitle.toptext();
            // document.title = title;
        } else {
            $('#md-title').remove();
        }
    }
    function wrapParagraphText () {
        // TODO is this true for marked.js?

        // markdown gives us sometime paragraph that contain child tags (like img),
        // but the containing text is not wrapped. Make sure to wrap the text in the
        // paragraph into a <div>

		// this also moves ANY child tags to the front of the paragraph!
		$('#md-content p').each (function () {
			var $p = $(this);
			// nothing to do for paragraphs without text
			if ($.trim($p.text ()).length === 0) {
				// make sure no whitespace are in the p and then exit
				//$p.text ('');
				return;
			}
			// children elements of the p
            var children = $p.contents ().filter (function () {
                var $child =  $(this);
                // we extract images and hyperlinks with images out of the paragraph
                if (this.tagName === 'A' && $child.find('img').length > 0) {
                    return true;
                }
                if (this.tagName === 'IMG') {
                    return true;
                }
                // else
                return false;
            });
            var floatClass = getFloatClass($p);
            $p.wrapInner ('<div class="md-text" />');

            // if there are no children, we are done
            if (children.length === 0) {
                return;
            }
            // move the children out of the wrapped div into the original p
            children.prependTo($p);

            // at this point, we now have a paragraph that holds text AND images
            // we mark that paragraph to be a floating environment
            // TODO determine floatenv left/right
            $p.addClass ('md-floatenv').addClass (floatClass);
		});
	}
	function removeBreaks (){
		// since we use non-markdown-standard line wrapping, we get lots of
		// <br> elements we don't want.

        // remove a leading <br> from floatclasses, that happen to
        // get insertet after an image
        $('.md-floatenv').find ('.md-text').each (function () {
            var $first = $(this).find ('*').eq(0);
            if ($first.is ('br')) {
                $first.remove ();
            }
        });

        // remove any breaks from image groups
        $('.md-image-group').find ('br').remove ();
    }
	function getFloatClass (par) {
		var $p = $(par);
		var floatClass = '';

		// reduce content of the paragraph to images
		var nonTextContents = $p.contents().filter(function () {
			if (this.tagName === 'IMG' || this.tagName === 'IFRAME') {
                return true;
            }
			else if (this.tagName === 'A') {
                return $(this).find('img').length > 0;
            }
			else {
				return $.trim($(this).text ()).length > 0;
			}
		});
		// check the first element - if its an image or a link with image, we go left
		var elem = nonTextContents[0];
		if (elem !== undefined && elem !== null) {
			if (elem.tagName === 'IMG' || elem.tagName === 'IFRAME') {
                floatClass = 'md-float-left';
            }
			else if (elem.tagName === 'A' && $(elem).find('img').length > 0) {
                floatClass = 'md-float-left';
            }
			else {
                floatClass = 'md-float-right';
            }
		}
		return floatClass;
	}
    // images are put in the same image group as long as there is
    // not separating paragraph between them
    function groupImages() {
        var par = $('p img').parents('p');
        // add an .md-image-group class to the p
        par.addClass('md-image-group');
    }

    // takes a standard <img> tag and adds a hyperlink to the image source
    // needed since we scale down images via css and want them to be accessible
    // in original format
    function linkImagesToSelf () {
        function selectNonLinkedImages () {
            // only select images that do not have a non-empty parent link
            $images = $('img').filter(function(index) {
                var $parent_link = $(this).parents('a').eq(0);
                if ($parent_link.length === 0) return true;
                var attr = $parent_link.attr('href');
                return (attr && attr.length === 0);
            });
            return $images;
        }
        var $images = selectNonLinkedImages ();
        return $images.each(function() {
            var $this = $(this);
            var img_src = $this.attr('src');
            var img_title = $this.attr('title');
            if (img_title === undefined) {
                img_title = '';
            }
            // wrap the <img> tag in an anchor and copy the title of the image
            $this.wrap('<a class="md-image-selfref" href="' + img_src + '" title="'+ img_title +'"/> ');
        });
    }

    function addInpageAnchors()
    {
        // adds a pilcrow (paragraph) character to heading with a link for the
        // inpage anchor
        function addPilcrow ($heading, href) {
            var $pilcrow = $('<a href="#" class="anchorjs-link"><span class="anchorjs-icon"></span></a>');
            $pilcrow.find('a').attr('href', href);
            $pilcrow.hide();

            var mouse_entered = false;
            $heading.mouseenter(function () {
                mouse_entered = true;
                if (!mouse_entered) return;
                $pilcrow.show();
            });
            $heading.mouseleave(function () {
                mouse_entered = false;
                $pilcrow.hide();
            });
            $pilcrow.appendTo($heading);
        }

        // adds a page inline anchor to each h1,h2,h3,h4,h5,h6 element
        // which can be accessed by the headings text
        $('h1,h2,h3,h4,h5,h6').not('#md-title h1').each (function () {
            var $heading = $(this);
            $heading.addClass('md-inpage-anchor');
            var text = $heading.clone().children('.anchorjs-link').remove().end().text();
            var href = $.md.util.getInpageAnchorHref(text);
            addPilcrow($heading, href);
        });
    }

    $.md.scrollToInPageAnchor = function(anchortext) {
        if (anchortext.startsWith ('#'))
            anchortext = anchortext.substring (1, anchortext.length);
        // we match case insensitive
        var doBreak = false;
        $('.md-inpage-anchor').each (function () {
            if (doBreak) { return; }
            var $this = $(this);
            // don't use the text of any subnode
            var text = $this.toptext();
            var match = $.md.util.getInpageAnchorText (text);
            if (anchortext === match) {
                this.scrollIntoView (true);
                var navbar_offset = $('.navbar-collapse').height() + 5;
                window.scrollBy(0, -navbar_offset + 5);
                doBreak = true;
            }
        });
    };

}(jQuery));

(function($) {
    'use strict';
    // call the gimmick
    $.mdbootstrap = function (method){
        if ($.mdbootstrap.publicMethods[method]) {
            return $.mdbootstrap.publicMethods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
            $.error('Method ' + method + ' does not exist on jquery.mdbootstrap');
        }
    };
    // simple wrapper around $().bind
    $.mdbootstrap.events = [];
    $.mdbootstrap.bind =  function (ev, func) {
        $(document).bind (ev, func);
        $.mdbootstrap.events.push (ev);
    };
    $.mdbootstrap.trigger = function (ev) {
        $(document).trigger (ev);
    };

    var navStyle = '';

    // PUBLIC API functions that are exposed
    var publicMethods = {
        bootstrapify: function () {
            createPageSkeleton();
            buildMenu ();
            changeHeading();
            replaceImageParagraphs();

            $('table').addClass('table').addClass('table-bordered');
            //pullRightBumper ();

            // remove the margin for headings h1 and h2 that are the first
            // on page
            //if (navStyle == "sub" || (navStyle == "top" && $('#md-title').text ().trim ().length === 0))
            //    $(".md-first-heading").css ("margin-top", "0");

            // external content should run after gimmicks were run
            $.md.stage('pregimmick').subscribe(function(done) {
                if ($.md.config.useSideMenu !== false) {
                    createPageContentMenu();
                }
                done();
            });
            $.md.stage('postgimmick').subscribe(function(done) {
                adjustExternalContent();
                highlightActiveLink();

                done();
            });
        }
    };
    // register the public API functions
    $.mdbootstrap.publicMethods = $.extend ({}, $.mdbootstrap.publicMethods, publicMethods);

    // PRIVATE FUNCTIONS:

    function buildTopNav() {
        // replace with the navbar skeleton
        if ($('#md-menu').length <= 0) {
            return;
        }
        navStyle = 'top';
        var $menuContent = $('#md-menu').children();

        // $('#md-menu').addClass ('navbar navbar-default navbar-fixed-top');
        // var menusrc = '';
        // menusrc += '<div id="md-menu-inner" class="container">';
        // menusrc += '<ul id="md-menu-ul" class="nav navbar-nav">';
        // menusrc += '</ul></div>';

        var navbar = '';
        navbar += '<div id="md-main-navbar" class="navbar navbar-default navbar-fixed-top" role="navigation">';
        navbar +=   '<div class="navbar-header">';
        navbar +=     '<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-ex1-collapse">';
        navbar +=       '<span class="sr-only">Toggle navigation</span>';
        navbar +=       '<span class="icon-bar"></span>';
        navbar +=       '<span class="icon-bar"></span>';
        navbar +=       '<span class="icon-bar"></span>';
        navbar +=     '</button>';
        navbar +=     '<a class="navbar-brand" href="#"></a>';
        navbar +=   '</div>';

        navbar +=   '<div class="collapse navbar-collapse navbar-ex1-collapse">';
        navbar +=     '<ul class="nav navbar-nav" />';
        navbar +=     '<ul class="nav navbar-nav navbar-right" />';
        navbar +=   '</div>';
        navbar += '</div>';
        var $navbar = $(navbar);

        $navbar.appendTo('#md-menu');
        // .eq(0) becase we dont want navbar-right to be appended to
        $('#md-menu ul.nav').eq(0).append($menuContent);

        // the menu should be the first element in the body
        $('#md-menu').prependTo('#md-all');

        var brand_text = $('#md-menu h1').toptext();
        $('#md-menu h1').remove();
        $('a.navbar-brand').text(brand_text);


        // then comes md-title, and afterwards md-content
        // offset md-title to account for the fixed menu space
        // 50px is the menu width + 20px spacing until first text
        // or heading
        $('#md-body').css('margin-top', '70px');
    }
    function buildSubNav() {
        // replace with the navbar skeleton
        /* BROKEN CODE
        if ($('#md-menu').length <= 0) {
            return;
        }
        navStyle = 'sub';
        var $menuContent = $('#md-menu').html ();

        var menusrc = '';
        menusrc += '<div id="md-menu-inner" class="subnav">';
        menusrc += '<ul id="md-menu-ul" class="nav nav-pills">';
        menusrc += $menuContent;
        menusrc += '</ul></div>';
        $('#md-menu').empty();
        $('#md-menu').wrapInner($(menusrc));
        $('#md-menu').addClass ('col-md-12');

        $('#md-menu-container').insertAfter ($('#md-title-container'));
        */
    }

    function buildMenu () {
        if ($('#md-menu a').length === 0) {
            return;
        }
        var h = $('#md-menu');

        // make toplevel <a> a dropdown
        h.find('> a[href=""]')
            .attr('data-toggle', 'dropdown')
            .addClass('dropdown-toggle')
            .attr('href','')
            .append('<b class="caret"/>');
        h.find('ul').addClass('dropdown-menu');
        h.find('ul li').addClass('dropdown');

        // replace hr with dividers
        $('#md-menu hr').each(function(i,e) {
            var hr = $(e);
            var prev = hr.prev();
            var next = hr.next();
            if (prev.is('ul') && prev.length >= 0) {
                prev.append($('<li class="divider"/>'));
                hr.remove();
                if (next.is('ul')) {
                    next.find('li').appendTo(prev);
                    next.remove();
                }
                // next ul should now be empty
            }
            return;
        });

        // remove empty uls
        $('#md-menu ul').each(function(i,e) {
            var ul = $(e);
            if (ul.find('li').length === 0) {
                ul.remove();
            }
        });

        $('#md-menu hr').replaceWith($('<li class="divider-vertical"/>'));


        // wrap the toplevel links in <li>
        $('#md-menu > a').wrap('<li />');
        $('#md-menu ul').each(function(i,e) {
            var ul = $(e);
            ul.appendTo(ul.prev());
            ul.parent('li').addClass('dropdown');
        });

        // submenu headers
        $('#md-menu li.dropdown').find('h1, h2, h3').each(function(i,e) {
            var $e = $(e);
            var text = $e.toptext();
            var header = $('<li class="dropdown-header" />');
            header.text(text);
            $e.replaceWith(header);
        });

        // call the user specifed menu function
        buildTopNav();
    }
    function isVisibleInViewport(e) {
        var el = $(e);
        var top = $(window).scrollTop();
        var bottom = top + $(window).height();

        var eltop = el.offset().top;
        var elbottom = eltop + el.height();

        return (elbottom <= bottom) && (eltop >= top);
    }

    function createPageContentMenu () {

        // assemble the menu
        var $headings = $('#md-content').find('h2').clone();
        // we dont want the text of any child nodes
        $headings.children().remove();

        if ($headings.length <= 1) {
            return;
        }

        $('#md-content').removeClass ('col-md-12');
        $('#md-content').addClass ('col-md-9');
        $('#md-content-row').prepend('<div class="col-md-3" id="md-left-column"/>');

        var recalc_width = function () {
            // if the page menu is affixed, it is not a child of the
            // <md-left-column> anymore and therefore does not inherit
            // its width. On every resize, change the class accordingly
            var width_left_column = $('#md-left-column').width();
            $('#md-page-menu').css('width', width_left_column+'px');
        };

        $(window).scroll(function() {
            recalc_width($('#md-page-menu'));
            var $first;
            $('*.md-inpage-anchor').each(function(i,e) {
                if ($first === undefined) {
                    var h = $(e);
                    if (isVisibleInViewport(h)) {
                        $first = h;
                    }
                }
            });
            // highlight in the right menu
            $('#md-page-menu a').each(function(i,e) {
                var $a = $(e);
                if ($first && $a.toptext() === $first.toptext()) {
                    $('#md-page-menu li.active').removeClass('active');
                    //$a.parent('a').addClass('active');
                    $a.parent().addClass('active');
                }
            });
        });


        var affixDiv = $('<nav id="md-page-menu" class="bs-docs-sidebar"/>');

        //var top_spacing = $('#md-menu').height() + 15;
        var top_spacing = 70;
        affixDiv.affix({
            //offset: affix.position() - 50,
            offset: 130
        });
        affixDiv.css('top', top_spacing);
        //affix.css('top','-250px');

        var $ul = $('<ul class="nav bs-docs-sidenav"/>');
        affixDiv.append($ul);

        $headings.each(function(i,e) {
            var $heading = $(e);
            var $li = $('<li/>');
            var $a = $('<a />');
            $a.attr('href', $.md.util.getInpageAnchorHref($heading.toptext()));
            $a.click(function(ev) {
                ev.preventDefault();

                var $this = $(this);
                var anchortext = $.md.util.getInpageAnchorText($this.toptext());
                $.md.scrollToInPageAnchor(anchortext);
            });
            $a.text($heading.toptext());
            $li.append($a);
            $ul.append($li);
        });

        $(window).resize(function () {
            recalc_width($('#md-page-menu'));
        });
        $.md.stage('postgimmick').subscribe(function (done) {
            // recalc_width();
            done();
        });

        //menu.css('width','100%');
        $('#md-left-column').append(affixDiv);

    }

    function createPageSkeleton() {

        $('#md-title').wrap('<div class="container" id="md-title-container"/>');
        $('#md-title').wrap('<div class="row" id="md-title-row"/>');

        $('#md-menu').wrap('<div class="container" id="md-menu-container"/>');
        $('#md-menu').wrap('<div class="row" id="md-menu-row"/>');

        $('#md-content').wrap('<div class="container" id="md-content-container"/>');
        $('#md-content').wrap('<div class="row" id="md-content-row"/>');

        $('#md-body').wrap('<div class="container" id="md-body-container"/>');
        $('#md-body').wrap('<div class="row" id="md-body-row"/>');

        $('#md-title').addClass('col-md-12');
        $('#md-content').addClass('col-md-12');

    }
    function pullRightBumper (){
 /*     $("span.bumper").each (function () {
			$this = $(this);
			$this.prev().addClass ("pull-right");
		});
		$('span.bumper').addClass ('pull-right');
*/
    }

    function changeHeading() {

        // HEADING
        var jumbo = $('<div class="page-header" />');
        $('#md-title').wrapInner(jumbo);
    }

    function highlightActiveLink () {
        // when no menu is used, return
        if ($('#md-menu').find ('li').length === 0) {
            return;
        }
		var filename = window.location.hash;

		if (filename.length === 0) {
            filename = '#!index.md';
        }
		var selector = 'li:has(a[href="' + filename + '"])';
		$('#md-menu').find (selector).addClass ('active');
    }

    // replace all <p> around images with a <div class="thumbnail" >
    function replaceImageParagraphs() {

        // only select those paragraphs that have images in them
        var $pars = $('p img').parents('p');
        $pars.each(function() {
            var $p = $(this);
            var $images = $(this).find('img')
                .filter(function() {
                    // only select those images that have no parent anchor
                    return $(this).parents('a').length === 0;
                })
                // add those anchors including images
                .add($(this).find ('img'))
                .addClass('img-responsive')
                .addClass('img-thumbnail');

            // create a new url group at the fron of the paragraph
            //$p.prepend($('<ul class="thumbnails" />'));
            // move the images to the newly created ul
            //$p.find('ul').eq(0).append($images);

            // wrap each image with a <li> that limits their space
            // the number of images in a paragraphs determines thei width / span

            // if the image is a link, wrap around the link to avoid
            function wrapImage ($imgages, wrapElement) {
                return $images.each(function (i, img) {
                    var $img = $(img);
                    var $parent_img = $img.parent('a');
                    if ($parent_img.length > 0)
                        $parent_img.wrap(wrapElement);
                    else
                        $img.wrap(wrapElement);
                });
            }

            if ($p.hasClass ('md-floatenv')) {
                if ($images.length === 1) {
                    wrapImage($images, '<div class="col-sm-8" />');
                } else if ($images.length === 2) {
                    wrapImage($images, '<div class="col-sm-4" />');
                } else {
                    wrapImage($images, '<div class="col-sm-2" />');
                }
            } else {

                // non-float => images are on their own single paragraph, make em larger
                // but remember, our image resizing will make them only as large as they are
                // but do no upscaling
                // TODO replace by calculation

                if ($images.length === 1) {
                    wrapImage($images, '<div class="col-sm-12" />');
                } else if ($images.length === 2) {
                    wrapImage($images, '<div class="col-sm-6" />');
                } else if ($images.length === 3) {
                    wrapImage($images, '<div class="col-sm-4" />');
                } else if ($images.length === 4) {
                    wrapImage($images, '<div class="col-sm-3" />');
                } else {
                    wrapImage($images, '<div class="col-sm-2" />');
                }
            }
            $p.addClass('row');
            // finally, every img gets its own wrapping thumbnail div
            //$images.wrap('<div class="thumbnail" />');
        });

        // apply float to the ul thumbnails
        //$('.md-floatenv.md-float-left ul').addClass ('pull-left');
        //$('.md-floatenv.md-float-right ul').addClass ('pull-right');
    }

    function adjustExternalContent() {
        // external content are usually iframes or divs that are integrated
        // by gimmicks
        // example: youtube iframes, google maps div canvas
        // all external content are in the md-external class

        $('iframe.md-external').not ('.md-external-nowidth')
            .attr('width', '450')
            .css ('width', '450px');

        $('iframe.md-external').not ('.md-external-noheight')
            .attr('height', '280')
            .css ('height', '280px');

        // make it appear like an image thumbnal
        //$('.md-external').addClass('img-thumbnail');

        //.wrap($("<ul class='thumbnails' />")).wrap($("<li class='col-md-6' />"));
        $('div.md-external').not('.md-external-noheight')
            .css('height', '280px');
        $('div.md-external').not('.md-external-nowidth')
            .css('width', '450px');

        // // make it appear like an image thumbnal
        // $("div.md-external").addClass("thumbnail").wrap($("<ul class='thumbnails' />")).wrap($("<li class='col-md-10' />"));

        // $("div.md-external-large").css('width', "700px")
    }
}(jQuery));

(function($) {
    //'use strict';
    var alertsModule = new MDwiki.Core.Module();
    alertsModule.init = function() {
        $.md.stage('bootstrap').subscribe(function(done) {
            createAlerts();
            done();
        });
    };
    $.md.wiki.gimmicks.registerModule(alertsModule);

    // takes a standard <img> tag and adds a hyperlink to the image source
    // needed since we scale down images via css and want them to be accessible
    // in original format
    function createAlerts() {
        var matches = $(select_paragraphs());
        matches.each(function() {
            var $p = $(this.p);
            var type = this.alertType;
            $p.addClass('alert');

            if (type === 'note') {
                $p.addClass('alert-info');
            } else if (type === 'hint') {
                $p.addClass('alert-success');
            } else if (type === 'warning') {
                $p.addClass('alert-warning');
            }
        });
    }

    // picks out the paragraphs that start with a trigger word
    function select_paragraphs() {
        var note = ['note', 'beachte' ];
        var warning = [ 'achtung', 'attention', 'warnung', 'warning', 'atención', 'guarda', 'advertimiento' ];
        var hint = ['hint', 'tipp', 'tip', 'hinweis'];
        var exp = note.concat(warning);
        exp = exp.concat(hint);
        var matches = [];

        $('p').filter (function () {
            var $par = $(this);
            // check against each expression
            $(exp).each (function (i,trigger) {
                var txt = $par.text().toLowerCase ();
                // we match only paragrachps in which the 'trigger' expression
                // is follow by a ! or :
                var re = new RegExp (trigger + '(:|!)+.*','i');
                var alertType = 'none';
                if (txt.match (re) !== null) {
                    if ($.inArray(trigger, note) >= 0) {
                        alertType = 'note';
                    } else if ($.inArray(trigger, warning) >= 0) {
                        alertType = 'warning';
                    } else if ($.inArray(trigger, hint) >= 0) {
                        alertType = 'hint';
                    }
                    matches.push ({
                        p: $par,
                        alertType: alertType
                    });
                }
            });
        });
        return matches;
    }
}(jQuery));

(function($) {
    // makes trouble, find out why
    //'use strict';
    var colorboxModule = new MDwiki.Core.Module();
    colorboxModule.init = function() {
        $.md.stage('gimmick').subscribe(function(done) {
            make_colorbox();
            done();
        });
    };
    $.md.wiki.gimmicks.registerModule(colorboxModule);

    function make_colorbox() {
        var $image_groups;
        if (!(this instanceof jQuery)) {
            // select the image groups of the page
            $image_groups = $('.md-image-group');
        } else {
            $image_groups = $(this);
        }
        // operate on md-image-group, which holds one
        // or more images that are to be colorbox'ed
        var counter = 0;
        return $image_groups.each(function() {
            var $this = $(this);

            // each group requires a unique name
            var gal_group = 'gallery-group-' + (counter++);

            // create a hyperlink around the image
            $this.find('a.md-image-selfref img')
            // filter out images that already are a hyperlink
            // (so won't be part of the gallery)

            // apply colorbox on their parent anchors
            .parents('a').colorbox({
                rel: gal_group,
                opacity: 0.75,
                slideshow: true,
                maxWidth: '95%',
                maxHeight: '95%',
                scalePhotos: true,
                photo: true,
                slideshowAuto: false
            });
        });
    }
}(jQuery));

(function($) {

    function highlight () {
        // marked adds lang-ruby, lang-csharp etc to the <code> block like in GFM
        var $codeblocks = $('pre code[class^=lang-]');
        return $codeblocks.each(function() {
            var $this = $(this);
            var classes = $this.attr('class');
            // TODO check for other classes and only find the lang- one
            // highlight doesnt want a lang- prefix
            var lang = classes.substring(5);
            $this.removeClass(classes);
            $this.addClass(lang);
            var x = hljs.highlightBlock($this[0]);
        });
    }

    var highlightGimmick = new MDwiki.Core.Module();
    highlightGimmick.init = function() {
        $.md.stage('gimmick').subscribe(function(done) {
            highlight();
            done();
        });
    };
    $.md.wiki.gimmicks.registerModule(highlightGimmick);
}(jQuery));

(function($) {
    'use strict';

    function create_iframe($links, opt, text) {
        return $links.each (function (i, link){
            var $link = $(link);
            var href = $link.attr('href');
            var $iframe = $('<iframe class="col-md-12" style="border: 0 solid red; height: 650px;"></iframe>');
            $iframe.attr('src', href);
            $link.replaceWith($iframe);

            if (opt.width)
                $iframe.css('width', opt.width);
            if (opt.height)
                $iframe.css('height', opt.height);
            else {
                var updateSizeFn = function () {
                    var offset = $iframe.offset();
                    var winHeight = $(window).height();
                    var newHeight = winHeight - offset.top - 5;
                    $iframe.height(newHeight);
                };

                $iframe.load(function(done) {
                    updateSizeFn();
                });

                $(window).resize(function () {
                    updateSizeFn();
                });
            }

        });
    }

    var iframeGimmick = new MDwiki.Core.Gimmick();
    iframeGimmick.addHandler('iframe', create_iframe);
    $.md.wiki.gimmicks.registerGimmick(iframeGimmick);
}(jQuery));

(function($) {

    function load_mathjax($links, opt, ref) {
        $links.remove();
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src  = $.md.prepareLink('cdn.bootcss.com/mathjax/2.4.0/MathJax.js?config=TeX-AMS-MML_HTMLorMML');
        document.getElementsByTagName('head')[0].appendChild(script);
    }
    var mathGimmick = new MDwiki.Core.Gimmick();
    mathGimmick.addHandler('math', load_mathjax);
    $.md.wiki.gimmicks.registerGimmick(mathGimmick);

}(jQuery));
