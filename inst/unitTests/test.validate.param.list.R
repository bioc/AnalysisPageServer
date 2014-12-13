test.validate.param.list <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  example(combobox.param)
  ## gives me "gene" combobox

  example(simple.param)
  ## gives me "x" simple

  example(compound.param)
  ## gives me "comp"

  example(array.param)
  ## gene.set
  
  example(select.param)
  ## color
  
  example(bool.param)
  ## show.ids

  example(file.param)
  ## cov.param

  pset <- param.set(gene=gene, x=x, comp=comp, gene.set=gene.set, color=color, show.ids=show.ids)

  validate.param.list <- AnalysisPageServer:::validate.param.list
  
  dies.ok(
         validate.param.list(pset, list(foo=1))
          , "Unknown parameters: foo")

  dies.ok(
          validate.param.list(pset, list(xmin=1, xmin=2))
          , "Repeated parameters: x")


  checkEquals(validate.param.list(pset, list(xmin=1)),
              list(xmin=1))


  
  ## ###################################################
  ## now test validating the individual parameter values

  
  ## #############
  ## text type
  checkEquals(validate.param.value(x, "foo"), "foo", "validate text")
  dies.ok(
          validate.param.value(x, 1:3)
          , "text param.* is not length 1")


  
  ## #############
  ## compound type
  compound.pars <- list(study="foo", comp="bar", feature.type="baz")
  checkEquals(validate.param.value(comp, compound.pars), compound.pars)
  dies.ok(
          validate.param.value(comp, c(compound.pars, list(badname=1)))
          , "unknown parameter name")
  dies.ok(
          validate.param.value(comp, c(compound.pars, list(study="bar")))
          , "duplicate name")

  compound.pars$study <- 1:5
  dies.ok(
          validate.param.value(comp, compound.pars)
          , "object is not length 1",
          "error propogated from child")
  
  ## ###########
  ## array type
  gs.val <- as.list(LETTERS)
  checkEquals(validate.param.value(gene.set, gs.val), gs.val)

  gene.set.with.max <- gene.set
  gene.set.with.max$max <- 15
  dies.ok(
          validate.param.value(gene.set.with.max, gs.val)
          , "max length.* < length\\(val\\)")

  gene.set.with.min <- gene.set
  gene.set.with.min$min <- 30
  dies.ok(
          validate.param.value(gene.set.with.min, gs.val)
          , "length\\(val\\) .* < min length")
  

  ## ###########
  ## bool type
  checkEquals(validate.param.value(show.ids, TRUE), TRUE)
  dies.ok(
          validate.param.value(show.ids, "foo")
          , "is not 'logical'")
  dies.ok(
          validate.param.value(show.ids, c(TRUE, TRUE))
          , "is not length 1")


  ## ###########
  ## select type
  checkEquals(validate.param.value(color, "green"), c(green="green"))

  ## transform labeled
  checkEquals(validate.param.value(color, c(green = "#00ff00"), transform.labeled=TRUE),
              list(v = "green", r = "#00ff00"))

  dies.ok(
          validate.param.value(color, "magenta")
          , "'magenta' is not among choices")


  
  ## #############
  ## combobox type
  checkEquals(validate.param.value(gene, "100"), c(`100`="100"))
  checkEquals(validate.param.value(gene, c(`100` = "ADAR1"), transform.labeled=TRUE),
              list(v="100", r="ADAR1"))
  dies.ok(
          validate.param.value(gene, 1:5)
          ,"is not length 1")

  ## #######################################
  ## check that transform.labeled propogates
  ## ... when validating array params
  genes <- array.param("genes", prototype=gene)
  gids <- list("1","100")
  checkEquals(validate.param.value(genes, gids),
              lapply(gids, function(gid) validate.param.value(gene, gid)))

  checkEquals(validate.param.value(genes, gids, transform.labeled=TRUE),
              lapply(gids, function(gid) validate.param.value(gene, gid, transform.labeled=TRUE)))


  ## ... when validating compound params
  bool.and.gene <- compound.param("bag", children=param.set(show.ids, gene))
  bag.val <- list(show_ids=TRUE, gene=c(`100` = "ADAR1"))
  checkEquals(validate.param.value(bool.and.gene, bag.val),
              bag.val)
  checkEquals(validate.param.value(bool.and.gene, bag.val, transform.labeled=TRUE),
              list(show_ids=TRUE, gene=validate.param.value(gene, bag.val$gene, transform.labeled=TRUE)))
  
  
}
