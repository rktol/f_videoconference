library(outliers)
source("http://aoki2.si.gunma-u.ac.jp/R/src/SG.R", encoding = "euc-jp")
library(ARTool)
library("tidyverse")
library(grid)
source("anovakun_450.txt")

d <- read.csv("./talktest.csv", header = TRUE, fileEncoding = "utf8")


d$condition <- factor(d$condition)
d$theme <- factor(d$theme)
d$group <- factor(d$group)
d$order <- factor(d$order)
d$name <- factor(d$name)


shapiro <- list()
out <- list()

d <- group_by(d,group,condition)
x <- summarise(d,mean=mean(沈黙時間),sd=sd(沈黙時間))
d <- summarise(d,沈黙時間=sum(沈黙時間))


x %>%
    ggplot(aes_string(x="condition", y="mean", fill = "condition")) + 
    geom_bar(stat="identity") +
    geom_errorbar(aes(ymax = mean + sd, ymin = mean - sd, width = 0.2), position = position_dodge(0.9), size = 0.75 )+
    ggtitle("沈黙時間")
# + scale_y_continuous(n.breaks = pointlimits[n], limits = c(1,pointlimits[n]))
ggsave("graph/talk/condition/bar_groupsilent2.png")


# 正規性のshapiro-wilk検定
shapiro <- shapiro.test(t(d$沈黙時間))
bartlett <- bartlett.test(d$沈黙時間 ~ condition, data = d)


# dataの整形
spreaddata <- list(d$group,d$condition,d$沈黙時間)
names(spreaddata) <- c("group","condition","沈黙時間")
spreaddata <- data.frame(spreaddata)
spreaddata <- spreaddata %>% tidyr::spread(key = condition,value=沈黙時間)
spreaddata <- spreaddata[,-1]


out <- append(list(shapiro),list(bartlett))

capture.output(anovakun(spreaddata, "sA", 3, holm = T, mau = T, eta = T), file ="talk/anova/condition/groupsilent_anova.txt")


capture.output(out, file = "talk/anova/condition/groupsilent_shapiro.txt")
