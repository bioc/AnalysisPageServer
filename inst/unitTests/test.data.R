test.data.frame.to.json <- function()  {
  library(RUnit)
  library(AnalysisPageServer)

  check.df <- function(df, exp, name)  {
    got <- data.frame.to.list(df)
    checkEquals(got,
                exp,
                name)
    lives.ok(AnalysisPageServer:::.validate.data.frame.list(got),
             paste(name, "lives ok"))
  }
  
  ## check that it gives a reasonable value when a data frame of 0 rows is given
  ## It should give an empty hash
  df <- data.frame(x=numeric(0), y=numeric(0))
  empty.named.list <- list()
  names(empty.named.list) <- character(0)

  check.df(df, empty.named.list,
           "data.frame.to.list(zero-row data.frame) is an empty list")



  df <- data.frame(x=1:2, y=c(T,F), z=c("A","B"), row.names=c("foo","bar"))

  check.df(df,
           list(foo=list(x=1, y=TRUE, z="A"),
                bar=list(x=2, y=FALSE, z="B")),
           " data.frame.to.list on a numeric/logical/character with named rows")


  df <- data.frame(x=1:2, y=c(T,F), z=c("A","B"))
  check.df(df,
           list(`1`=list(x=1, y= TRUE, z="A"),
                `2`=list(x=2, y=FALSE, z="B")),
           " data.frame.to.list: unnamed rows become 1,2,3...")



  df <- data.frame(row.names=c("A","B"))
  named.empty.list <- setNames(list(), character())
  check.df(df,
           list("A" = named.empty.list,
                "B" = named.empty.list),
           " data.frame.to.list: 0-column dataframe")

  
}



test.data.nodes <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  test.datanode <- function(call,
                            explist,
                            expclass="AnalysisPageDataNode")  {
    class(explist) <- expclass
    name <- deparse(substitute(call))

    lives.ok(eval(got <- eval(call)), name)

    checkEquals(got,
                explist,
                name)

    lives.ok(AnalysisPageServer:::.validate.datanode(got),
             paste(name, "validates"))

    invisible(got)
  }

  test.datanode(new.datanode.simple(name="foo", value=3),
                list(type="simple", name="foo", label="foo", description="foo", value=3))


  
  adf <- Biobase::AnnotatedDataFrame(data.frame(A=1:10, B = 10:1, row.names=LETTERS[1:10]),
                                     varMetadata=data.frame(labelDescription=c("Aaa", "Bbb"), type=c("int", "int"), row.names=c("A","B")))

  exp.vmd <- Biobase::varMetadata(adf)
  names(exp.vmd)[1] <- "label"
  
  tablenode.expvalue <- list(data = data.frame.to.list(Biobase::pData(adf)),
                             meta = data.frame.to.list(exp.vmd),
                             caption = "")
  table.node <- test.datanode(new.datanode.table(name="foo", data=adf),
                              list(type="table",
                                   name="foo",
                                   label="foo",
                                   description="foo",
                                   value=tablenode.expvalue))


  test.datanode(new.datanode.table(name= "foo", data=adf, caption="caption"),
                list(type="table",
                     name="foo",
                     label="foo",
                     description="foo",
                     value=c(tablenode.expvalue[1:2], list(caption="caption"))))

  
  plot.file <- "file.svg"
  test.datanode(new.datanode.plot(name="foo", plot.file=plot.file, table=table.node),
                list(type="plot",
                     name="foo",
                     label="foo",
                     description="foo",
                     value=list(plot=plot.file,
                       table=table.node)))
                            

  n1 <- new.datanode.simple("foo", 3)
  n2 <- new.datanode.simple("bar", 42)

  test.datanode(new.datanode.array(name="baz", children=list(n1,n2)),
                list(type="array",
                     name="baz",
                     label="baz",
                     description="baz",
                     value=list(n1,n2)))


  ## degenerate case: empty array
  test.datanode(new.datanode.array(name="baz", children=list()),
                list(type="array",
                     name="baz",
                     label="baz",
                     description="baz",
                     value=list()))
  
  

  ## now test label and escription auto-fill stuff
  got <- new.datanode.simple(name="foo", value=3, label="foolab")
  checkEquals(got$label, "foolab")
  checkEquals(got$description, "foolab")

  got <- new.datanode.simple(name="foo", value=3, description="food")
  checkEquals(got$label, "foo")
  checkEquals(got$description, "food")


  ## test warnings
  got <- new.datanode.simple(name="foo", value = 3, warnings = c("warn foo","warn bar"))
  checkEquals(got$warnings,
              c("warn foo", "warn bar"))


  test.datanode(new.datanode.html(name="baz", value = "<a href=\"http://foo.com\">bar</a>"),
                list(type="html",
                     name="baz",
                     label="baz",
                     description="baz",
                     value="<a href=\"http://foo.com\">bar</a>"))
  

}
