快速开始
===========

Note: 这是一个静态的基于mdwiki修改的markdown wiki，非常适合快速搭建简单的wiki系统，如果你想了解更多详情，请访问 [https://github.com/Dynalon/mdwiki/](https://github.com/Dynalon/mdwiki/)

Markdown基本语法
--------

MDWiki 支持最基本的Markdown语法，同时支持直接书写HTML和语法高亮、表格.

一个简单的例子:

```
标题
=======

子标题
----------

 * 列表
 * 列表
    1. sdf
    2. 列表项

这里是一个连接 [fifsky](http://fifsky.com)，显示一个`tag`

如果不想显示图片的话:

![图片Alt](http://placekitten.com/g/250/250)

 > 这里是引用的内容
 > 这里是引用的内容

```

创建链接
-------

站外链接:

    [fifsky](http://www.fifsky.com)

wiki链接:

    [Go to index](index.md)

wiki链接会自动添加hash `#!` :

[Go to index](index.md)

##表格
如果你想显示表格，可以参照下面的例子:

    | Tables        | Are           | Cool  |
    | ------------- |:-------------:| -----:|
    | col 3 is      | right-aligned | $1600 |
    | col 2 is      | centered      |   $12 |
    | zebra stripes | are neat      |    $1 |

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

- - - -

##语法高亮

一段php语法高亮的例子:

    ```php
    <?php
        $a = true;
        if($a){
            echo 'hello world';
        }
    ?>
    ```

render:

```php
<?php
    $a = true;
    if($a){
        echo 'hello world';
    }
?>
```

支持语言列表如下:

|Language       |Keyword      |
|---------------|-------------|
|Bash           |bash         |
|C#             |csharp       |
|Clojure        |clojure      |
|C++            |cpp          |
|CSS            |css          |
|CoffeeScript   |coffeescript |
|CMake          |cmake        |
|HTML           |html         |
|HTTP           |http         |
|Java           |java         |
|JavaScript     |javascript   |
|JSON           |json         |
|Markdown       |markdown     |
|Objective C    |objectivec   |
|Perl           |perl         |
|PHP            |php          |
|Python         |python       |
|Ruby           |ruby         |
|R              |r            |
|SQL            |sql          |
|Scala          |scala        |
|Vala           |vala         |
|XML            |xml          |

##公式

你想要玩更高级的功能吗？你可以像下面这样

    $$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$
[gimmick: math]()    
$$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$


$$ \frac{\partial \phi}{\partial x} \vert_b = \frac{1}{\Delta x/2}(\phi_0-\phi_b) $$

$$ \int u \frac{dv}{dx}\,dx=uv-\int
\frac{du}{dx}v\,dx\lim_{n\rightarrow \infty }
\left (  1 +\frac{1}{n} \right )^n
$$

> End enjoy!

