# MDWiki
* 这是一个静态的基于mdwiki修改的markdown wiki，非常适合快速搭建简单的wiki系统 [Demo](https://mdwiki.fifsky.com/)

* 原本的mdwiki所有文件写在一个html页面，我将所有JS文件拆开，主要的JS文件采用了CDN引入，你也可以修改为自己的路径，

* 所有md文件修改为放置在content目录

* 这个版本去除了很多需要翻墙才能使用的特性，比如facebook,gist,google map，如果你需要这些特性，请参照原版将JS代码copy到`static/js/mdwiki.js`中就可以了

* 这个wiki代码采用了marked库作为markdown的解析 See https://github.com/chjj/marked

* 支持语法高亮和公式请参考content/index.md文件

* 如果你需要定制化，你可以参看源码，原理并不复杂，你可以很容易的修改

* 如果你想了解更多详情，请访问 [https://github.com/Dynalon/mdwiki/](https://github.com/Dynalon/mdwiki/)
