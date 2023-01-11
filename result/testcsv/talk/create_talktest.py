# coding: UTF-8

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

alldata = [[],[]]

for g_index,group in enumerate(groups):
    for c_index,c in enumerate(condition):
        path ='./{0}_{1}.csv'.format(group,c)
        # print('group{0},condition{1}'.format(group,c))
        filelist = glob.glob(path)
        for file in filelist:
            data = []
            with open(file,encoding="utf-8-sig") as f:
                reader = csv.reader(f)
                for row in reader:
                    tmp = []
                    for n,num in enumerate(row):
                        if(n == 1 or n==2 or n==3):
                            tmp.append(float(num))
                        else:
                            tmp.append(num)
                    data.append(tmp)
            data = sorted(data, key=lambda x: x[1])
            alldata[g_index].append(data)


name_init = [{"yokoyama":0,"tsunoda":0,"tamura":0,"konishi":0,"ishibashi":0,"ichikawa":0},{"ohyama":0,"sugiyama":0,"suzuki":0,"sei":0,"tanokashira":0,"nishikawa":0}]
testdata = [["name","group","condition","theme","order","発話数","talktime","話者交替数","発話衝突Aの回数","発話衝突Bの回数","沈黙時間"]]
for index_a,a in enumerate(alldata):
    for index_log,log in enumerate(a):

        endtime = name_init[index_a].copy()
        turn = name_init[index_a].copy()
        turntaking = name_init[index_a].copy()
        # 自分の発話の前にどれだけ沈黙時間が発生していたか
        silenttime = name_init[index_a].copy()
        talktime = name_init[index_a].copy()
        # 対話開始が他の人と被った
        collision_a = name_init[index_a].copy()
        # 自分の対話中に他の人が被ってきた
        collision_b = name_init[index_a].copy()

        for index,item in enumerate(log):

            # 発話衝突判定&沈黙時間判定
            tmp = item[1]
            for name in names[index_a]:
                if(endtime[name] > item[1]):
                    collision_a[item[0]] += 1
                    collision_b[name] += 1
                
                if( tmp > item[1] - endtime[name]):
                    tmp = item[1] - endtime[name]
            if(tmp < 0):
                tmp = 0
            silenttime[item[0]] += tmp
            
            # 話者交替数
            if(index != 0):
                if(item[0] != log[index-1][0]):
                    turntaking[item[0]] += 1
            
            # 参加者一人の合計発話時間
            talktime[item[0]] += item[3]

            # 各参加者の発話ターン
            turn[item[0]] += 1
            
            # endtimeの修正
            endtime[item[0]] = item[2]
        
        for name in names[index_a]:
            tmpdata = []
            tmpdata.append(name)
            tmpdata.append(groups[index_a])
            tmpdata.append(conditionname[index_log])
            tmpdata.append(theme[index_a][index_log])
            tmpdata.append(order[index_a][index_log])
            tmpdata.append(float(turn[name]))
            tmpdata.append(float(talktime[name]))
            tmpdata.append(float(turntaking[name]))
            tmpdata.append(float(collision_a[name]))
            tmpdata.append(float(collision_b[name]))
            tmpdata.append(float(silenttime[name]))
            testdata.append(tmpdata)
        
        # print(endtime)
        # print(collision_a)
        # print(collision_b)
        # print(turn)
        # print(talktime)
        # print(turntaking)
        # print(silenttime)
print(testdata)

with open('../talktest.csv'.format(group,c), 'w', newline="",encoding="utf-8") as g:
    writer = csv.writer(g, lineterminator='\n')
    for row in testdata:
        writer.writerow(row)
