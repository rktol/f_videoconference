import csv
import os
import glob
import numpy as np


groups = ["1", "2"]
condition = ["0","1", "2"]
conditionname = ["サイズ＋配置","サイズ","話し手強調"]
id = ["0","1", "2", "3","4","5"]
names = [["yokoyama","tsunoda","tamura","konishi","ishibashi","ichikawa"],["ohyama","sugiyama","suzuki","sei","tanokashira","nishikawa"]]
theme = [["レンガ","靴下","鍋"],["鍋","レンガ","靴下",]]
order = [[1,2,3],[2,3,1]]
filenames = []

alldata = [[[],[],[],[],[],[]],[[],[],[],[],[],[]]]

for g_index,group in enumerate(groups):
    for n_index,name in enumerate(names[g_index]):
        for c_index,c in enumerate(condition):
            for id in [0,1,2,3,4,5]:
                path ='./analysisdata/{0}/{1}_{2}_{3}_gaze.csv'.format(group,name,c,id)
                # print('group{0},condition{1}'.format(group,c))
                filelist = glob.glob(path)
                for file in filelist:
                    data = []
                    with open(file,encoding="utf-8-sig") as f:
                        reader = csv.reader(f)
                        for row_index,row in enumerate(reader):
                            if(row_index != 0):
                                tmp = []
                                for n,num in enumerate(row):
                                    if(n == 0 or n == 1 or n==2 or n==3 or n == 4):
                                        tmp.append(float(num))
                                tmp.append(float(id))
                                data.append(tmp)
                    data = sorted(data, key=lambda x: x[1])
                    alldata[g_index][n_index].append(data)

# print(alldata[0][0][1])

testdata = [["name","group","condition","theme","order","gazecount","gazetime"]]
for index_gd,groupdata in enumerate(alldata):
    for index_nd,namedata in enumerate(groupdata):
        for index_cd,conditiondata in enumerate(namedata):
            gazecount = 0
            gazetime = 0
            tmptime = 0

            for index,item in enumerate(conditiondata):
                if(index != 0):
                    if(index != 1):
                        if(item[4] == item[5] and conditiondata[index-1][4] != conditiondata[index-1][5]):
                            tmptime = item[0]
                        if(item[4] != item[5] and conditiondata[index-1][4] == conditiondata[index-1][5]):
                            gazecount += 1
                            gazetime += (item[1] - tmptime)

            tmpdata = []
            tmpdata.append(names[index_gd][index_nd])
            tmpdata.append(groups[index_gd])
            tmpdata.append(conditionname[index_cd])
            tmpdata.append(theme[index_gd][index_cd])
            tmpdata.append(order[index_gd][index_cd])
            tmpdata.append(float(gazecount))
            tmpdata.append(float(gazetime))

            testdata.append(tmpdata)

# print(testdata)

with open('./testcsv/gazetest.csv', 'w', newline="",encoding="utf-8") as g:
    writer = csv.writer(g, lineterminator='\n')
    for row in testdata:
        writer.writerow(row)