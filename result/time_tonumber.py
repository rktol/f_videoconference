# coding: UTF-8

import csv
import os
import glob


group = ["1", "2"]
condition = ["0","1", "2"]
id = ["0","1", "2", "3","4","5"]
name = ["yokoyama","tsunoda","tamura","konishi","ishibashi","ichikawa","nishikawa","ohyama","sei","sugiyama","suzuki","tanokashira"]
rate = [[-0.876,4.838,12.059,3.353,10.608,0.165,,,,,],[2.020,6.760,11.162,7.617,6.764],[]]
filenames = []

for g in group:
    path ='{0}/*.csv'.format(g)
    filelist = glob.glob(path)
    for file in filelist:
        filenames.append(file)
        data = []
        with open(file,encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            for index,row in enumerate(reader):
                tmp = []
                if(index == 0):
                    data.append(row)
                else:
                    for n,col in enumerate(row):
                        if(n == 0 or n == 1):
                            tmp.append(float(col))
                        else:
                            tmp.append(col)
                    data.append(tmp)

        with open('./analysisdata/{0}'.format(file), 'w', newline="",encoding="utf-8") as g:
            writer = csv.writer(g, lineterminator='\n')
            for row in data:
                writer.writerow(row)

