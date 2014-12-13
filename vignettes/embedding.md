<!--
%\VignetteEngine{knitr::knitr}
%\VignetteIndexEntry{2. Embedding APS datasets in other documents}
-->

<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="css/concatenated.css" rel="stylesheet" type="text/css" />
<link id="ep-svg-styles" href="css/svg.css" type="text/css" rel="stylesheet">
<script id="ep-entry-script" data-main="js/requirejs-config" src="js/concatenated-modules.js?v=3.7.0"></script>

<link rel="stylesheet" type="text/css" href="AnalysisPageServer.css">


# Embedding APS datasets in other documents

AnalysisPageServer datasets can be embedded within other (HTML) documents.



## Embedding within a knitr document

AnalysisPageServer datasets can be embedded within knitr documents such
as the one you are reading.

To do so, first call `setup.APS.knitr()` to set things up.
The main purpose of this call is to include some javascript and CSS
that makes the interactivity work.
See the documentation
of that function for more details:


```r
library(AnalysisPageServer)
setup.APS.knitr()
```

Then, proceed as your normally would with your `knitr` document. At the point you want
to insert an AnalysisPageServer dataset, make a call to `embed.APS.dataset()`.
In typical usage the first argument is a code block wrapped in `{`curly brackets`}` that contains
your plotting code. You also have to
pass the data. This can either be the return value of the code block, or you can provide
it explicity as the second argument:


```r
x <- seq(0, 2*pi, length = 100)
y <- sin(x) + rnorm(100)/10
col <- adjustcolor(heat.colors(100), alpha.f = 0.6)
embed.APS.dataset({
                    plot(x, y, col = col, pch = 19)
                  },
                  df = data.frame(x=x, y=y, X=x, Y=y),
                  title = "A shaky sine curve",
                  data.subdir = "embed-example")
```

<div class="ep-analysis-page-data-set container-fluid"
  data-sidebar-visible="yes"
  data-table-visible="yes"
  data-svg="embed-example/dataset-7-GKVXCg.svg"
  data-set="embed-example/dataset-7-GKVXCg.json"></div>


You can have two datasets on the same page. In the next example we also hide the sidebar
and data table with `show.sidebar = FALSE` and `show.table = FALSE`, and pass in a little extra
styling to get some margins on the sides.


```r
x <- rep(1:nrow(volcano), each = ncol(volcano))
y <- rep(1:ncol(volcano), nrow(volcano))
volcano.cells <- data.frame(x = x, y = y, Height = as.vector(t(volcano)))
embed.APS.dataset({
                    image(volcano, xaxt = "n", yaxt = "n", main = "Maunga Whau Volcano")
                  },                
                  df = volcano.cells,
                  title = "", data.subdir = "embed-example",
                  show.table = FALSE, show.sidebar = FALSE,
                  show.xy = TRUE,     
                  extra.div.attr = c(style = "width:60%; margin:0 auto"))
```

<div class="ep-analysis-page-data-set container-fluid"
  data-sidebar-visible="no"
  data-table-visible="no"
  style="width:60%; margin:0 auto"
  data-svg="embed-example/dataset-8-Svh4pp.svg"
  data-set="embed-example/dataset-8-Svh4pp.json"></div>


The `<div>` element to which the extra attributes, such as styling, are applied is the outer container that holds the plot, the
sidebar, and the table. The current version does not support custom styling of the sub-elements.

Omit the first argument to just show the table:


```r
embed.APS.dataset(df = iris,
                  title = "Iris data with no plot", data.subdir = "embed-example")
```

<div class="ep-analysis-page-data-set container-fluid"
  data-sidebar-visible="yes"
  data-table-visible="yes"
  data-set="embed-example/dataset-9-Yd2put.json"></div>


## Embedding within any HTML document

In order to embed an AnalysisPageServer dataset into an HTML document
you first have to copy the "front end" files, including CSS, Javascript
other resources, into the directory where your HTML document will live.
If you are going to write more than one HTML document to the same directory
then you only have to do this once. The `copy.front.end()` function
does this for you. For example,


```r
basedir <- dirname(html.file)
copy.front.end(basedir)
```

Next you must include header lines in your HTML file
to bring in the CSS, Javascript and other
resources required by the front end.
These are returned by this function call:


```r
cat(custom.html.headers())
```

```
## <meta name="viewport" content="width=device-width, initial-scale=1.0">
## <link href="css/concatenated.css" rel="stylesheet" type="text/css" />
## <link id="ep-svg-styles" href="css/svg.css" type="text/css" rel="stylesheet">
## <script id="ep-entry-script" data-main="js/requirejs-config" src="js/concatenated-modules.js?v=3.7.0"></script>
```

Normally they would appear within the `<head>` section of your document.

After that, use the `embed.APS.dataset()` function as described above
to make plots or datasets. Be careful to include `outdir = basedir` so it
knows where to write the SVG and JSON files. Otherwise they would end up in the
current directory, which might not work. Aside from writing those files, `embed.APS.dataset`
returns a `<div>` each time you call it, and
you can then lay these elements out as you like within your HTML document.

Here is an example of what that looks like:


```
## <div class="ep-analysis-page-data-set container-fluid"
##   data-sidebar-visible="yes"
##   data-table-visible="yes"
##   data-svg="embed-example/dataset-7-GKVXCg.svg"
##   data-set="embed-example/dataset-7-GKVXCg.json"></div>
```

The `embed.APS.dataset()` accepts a few arguments
that allow you to control the inclusion of the table, of
the sidebar, or to add extra HTML classes or attributes to the `<div>`.


-------------

## Next
[Walk through interactive functionality on basic example](Interactivity.html)
