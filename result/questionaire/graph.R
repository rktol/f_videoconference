library(outliers)
source("http://aoki2.si.gunma-u.ac.jp/R/src/SG.R", encoding = "euc-jp")
library(ARTool)
library("tidyverse")
library(ggplot2)
library(grid)

d <- read.csv("./answer.csv", header = TRUE, fileEncoding = "utf8")

theme = c("レンガ","靴下","靴下","鍋","鍋","レンガ")
# theme = c("レンガ","靴下","鍋","靴下","鍋","レンガ","鍋","レンガ","靴下")

group = c("A","B","A","B","A","B")
# group = c("A","B","C","A","B","C","A","B","C")

order = c(1,3,2,1,3,2)
# order = c(1,3,2,2,1,3,3,2,1)

tmp <- list(NULL,NULL,NULL)
names(tmp) <- c("theme","order","group")

k <- length(d$condition)

for(n in 1:k){
    if(d$condition[n]==0){
        d$condition[n] <- "サイズ＋配置"
    }else if(d$condition[n]==1){
        d$condition[n] <- "サイズ"
    }else if(d$condition[n]==2){
        d$condition[n] <- "話し手強調"
    }
}




for (n in 1:6){
    for(m in 1:6){
        tmp$theme <- append(tmp$theme,theme[n])
        tmp$group <- append(tmp$group,group[n])
        tmp$order <- append(tmp$order,order[n])
    }
}

d <- append(d,tmp)
d <- data.frame(d)

d$condition <- factor(d$condition)
d$theme <- factor(d$theme)
d$group <- factor(d$group)
d$order <- factor(d$order)
d$name <- factor(d$name)

d <- transform(d, condition=factor(condition, levels=c("サイズ＋配置","サイズ","話し手強調")))

name <- names(d)

pointlimits <- c(0,0,0,10,10,10,10,5,5,5,5,5,5,5,5,5,5)


shapiro <- list()

# 条件,theme,orderごとにグラフ生成
for(m in c(3,18,19)){
# for(m in c(3)){
    for(n in 4:17){
        title <- name[[n]]
        titledata <- title
        d %>%
            ggplot(aes_string(x=name[[m]],y=title,fill = name[[m]])) +
            geom_boxplot() +
            ylab("")+
            ggtitle(title) +
            scale_y_continuous(n.breaks = pointlimits[n], limits = c(1,pointlimits[n]))
        ggsave(sprintf("%s/boxplot_%s.png",name[[m]],title))

        eval(parse(text=paste("xx <- group_by(d,",name[[m]],")")))
        eval(parse(text=paste("xx <- summarise(xx,mean=mean(",title,"),sd=sd(",title,"))")))
        

        # d %>%
        # xx %>%
        #     ggplot(aes_string(x=name[[m]], y="mean", fill = name[[m]])) + 
        #     geom_bar(stat="identity") +
        #     geom_errorbar(aes(ymax = mean + sd, ymin = mean - sd, width = 0.2), position = position_dodge(0.9), size = 0.75 )+
        #     ylab("")+
        #     ggtitle(title)
        # # + scale_y_continuous(n.breaks = pointlimits[n], limits = c(1,pointlimits[n]))
        # # ggsave(sprintf("%s/bar_%s.png",name[[m]],title))
        # ggsave(sprintf("%s/bar_mean_%s.png",name[[m]],title))

        # 正規性のshapiro-wilk検定
        # eval(parse(text=paste("shapiro <- append(shapiro,list(shapiro.test(t(d$",title,"))))")))

        eval(parse(text=paste("shapiro <- shapiro.test(t(d$",title,"))")))
        eval(parse(text=paste("bartlett <- bartlett.test(d$",title," ~ ",name[[m]],", data = d)")))

        # artした後にanova
        eval(parse(text=paste("henkan <- art(",title," ~ ",name[m]," + Error(name), data = d)")))

        henkan_res <- anova(henkan)
        art_res <- list()

        # h[[9]][1]がP値
        if (henkan_res[[9]][1] < 0.1) {
            art_res <- art.con(henkan, name[[m]]) %>%
                summary() %>%
                mutate(sig = symnum(p.value,
                    corr = FALSE, na = FALSE,
                    cutpoints = c(0, 0.001, 0.01, 0.05, 0.1, 1),
                    symbols = c("***", "**", "*", ".", " ")
                ))
        }else{
            art_res <- "None"
        }


        # friedman -> Bonferroni
        # dataの整形
        spreaddata <- list(d$name,d[[m]],d[[n]])
        names(spreaddata) <- c("name",name[[m]],title)
        spreaddata <- data.frame(spreaddata)
        eval(parse(text=paste("spreaddata <- spreaddata %>% tidyr::spread(key = ",name[[m]],",value=",title,")")))
        spreaddata <- spreaddata[,-1]
        friedman_res <- friedman.test(as.matrix(spreaddata))

        Bon_res <- list()

        if(friedman_res[[3]] < 0.10){
            x <- stack(spreaddata)
            value <- x[,1]
            index <- x[,2]
            Bon_res <- pairwise.wilcox.test(value,index,p.adj="bonferroni",exact=F,paired=T)

        }else{
            Bon_res <- "None"
        }
        out <- append(list(shapiro),list(bartlett))
        out <- append(out,list(henkan_res))
        out <- append(out, list(art_res))
        out <- append(out,list(friedman_res))
        out <- append(out,list(Bon_res))

        # capture.output(anovakun(spreaddata, "sA", 3, holm = T, mau = T, eta = T), file = sprintf("%s/anova_%s.txt",name[m],title))

        # capture.output(out, file = sprintf("%s/art_anova_%s.txt",name[m],title))

    }
}

