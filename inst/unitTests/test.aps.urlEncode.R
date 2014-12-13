test.aps.urlEncode <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  ## We are checking all the corner cases that aps.urlEncode is supposed to
  ## handle which urlEncode does not.
    
  ## not sure why this thing has names but I don't want to change ti
  checkEquals(unname(aps.urlEncode(1:3)),
              as.character(1:3))

  checkEquals(unname(aps.urlEncode("")), "")

  ## This is a bit wonky. My provided urlEncode function encodes
  ## NA as %4E%41. In RAapche it just makes it "NA". Either is fine,
  ## so we call urlDecode to ignore that difference.
  checkEquals(urlDecode(unname(aps.urlEncode(NA))), "NA")
}
