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
            path ='./analysisdata/{0}/{1}_{2}_*_score.csv'.format(group,name,c)
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
                                else:
                                    tmp.append(num)
                            data.append(tmp)
                data = sorted(data, key=lambda x: x[1])
                alldata[g_index][n_index].append(data)


testdata = [["name","group","condition","theme","order","count","lefthand","lefthandtime","righthand","righthandtime","開口回数","開口時間","頷き回数","話し手への視線配布の時間"]]
for index_gd,groupdata in enumerate(alldata):
    for index_nd,namedata in enumerate(groupdata):
        for index_cd,conditiondata in enumerate(namedata):
            count = 0
            lefthand =0
            lefthandtime = 0
            righthand = 0
            righthandtime = 0
            mouth = 0
            mouthtime = 0
            nod = 0
            gazespeaker = 0

            tmptime = [0,0,0,0]

            for index,item in enumerate(conditiondata):
                if(index != 0):
                    # 発話欲求カウント
                    count += item[4]

                    # hand
                    if(index != 1):
                        if(item[5] == "true" and conditiondata[index-1][5] == "false"):
                            tmptime[0] = item[0]
                        if(item[5] == "false" and conditiondata[index-1][5] == "true"):
                            lefthand += 1
                            lefthandtime += (item[1] - tmptime[0])

                        if(item[6] == "true" and conditiondata[index-1][6] == "false"):
                            tmptime[1] = item[0]
                        if(item[6] == "false" and conditiondata[index-1][6] == "true"):
                            righthand += 1
                            righthandtime += (item[1] - tmptime[1])
                    
                    # mouth
                    if(index != 1):
                        if(item[6] == "true" and conditiondata[index-1][6] == "false"):
                            tmptime[2] = item[0]
                        if(item[6] == "false" and conditiondata[index-1][6] == "true"):
                            mouth += 1
                            mouthtime += (item[1] - tmptime[2])

                    # nod
                    if(item[8] == "true"):
                        nod += 1

                    # gaze
                    if(index != 1):
                        if(item[9] == "true" and conditiondata[index-1][9] == "false"):
                            tmptime[3] = item[0]
                        if(item[9] == "false" and conditiondata[index-1][9] == "true"):
                            gazespeaker += (item[1] - tmptime[3])

            

            tmpdata = []
            count  = count / len(conditiondata)
            tmpdata.append(names[index_gd][index_nd])
            tmpdata.append(groups[index_gd])
            tmpdata.append(conditionname[index_cd])
            tmpdata.append(theme[index_gd][index_cd])
            tmpdata.append(order[index_gd][index_cd])
            tmpdata.append(float(count))
            tmpdata.append(float(lefthand))
            tmpdata.append(float(lefthandtime))
            tmpdata.append(float(righthand))
            tmpdata.append(float(righthandtime))
            tmpdata.append(float(mouth))
            tmpdata.append(float(mouthtime))
            tmpdata.append(float(nod))
            tmpdata.append(float(gazespeaker))

            testdata.append(tmpdata)
            
# print(testdata)

with open('./testcsv/scoretest.csv'.format(group,c), 'w', newline="",encoding="utf-8") as g:
    writer = csv.writer(g, lineterminator='\n')
    for row in testdata:
        writer.writerow(row)
