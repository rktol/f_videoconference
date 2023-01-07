import csv
import os
import glob
import numpy as np

def beforeSpeaker(starttime,number,data):
    if(number == 0):
        return False
    tof=False
    if(starttime - data[number][0] < 5.0):
        tof = beforeSpeaker(starttime,number-1,data)
    if(tof == False):
        if(data[number][4]=="addressee"):
            return True
        else:
            return False
    elif(tof == True):
        return True

def afterAddressee(endtime,number,data):
    if(number == len(data)-1):
        return False
    tof=False
    if(data[number][0] - endtime < 5.0):
        tof =afterAddressee(endtime,number+1,data)
    if(tof == False):
        if(data[number][4]=="speaker"):
            return True
        else:
            return False
    elif(tof == True):
        return True

def bystanderTobystander(number,data):
    i = number+1
    if(len(data) -1 <= i):
        return False
    while (data[i][4] != "bystander"):
        if(data[i][4] == "speaker"):
            break
        i+=1
        if(len(data)-1==i):
            break
    else:
        return True
    return False

def sideparticipantTospeaker(number,data):
    if((number+1 == len(data)) or (number-1 == 0)):
        return False
    if(data[number+1][4] == "speaker"):
        if(data[number][1]-data[number][0] > 5.0):
            return True
        else:
            if(data[number-1][4] != "addressee"):
                return True
    return False



groups = ["1", "2"]
condition = ["0","1", "2"]
id = ["0","1", "2", "3","4","5"]
names = [["yokoyama","tsunoda","tamura","konishi","ishibashi","ichikawa"],["ohyama","sugiyama","suzuki","sei","tanokashira","nishikawa"]]
theme = [["レンガ","靴下","鍋"],["鍋","レンガ","靴下",]]
order = [[1,2,3],[2,3,1]]
filenames = []

alldata = [[[],[],[],[],[],[]],[[],[],[],[],[],[]]]

for g_index,group in enumerate(groups):
    for n_index,name in enumerate(names[g_index]):
        for c_index,c in enumerate(condition):
            path ='./analysisdata/{0}/{1}_{2}_*_parsta.csv'.format(group,name,c)
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
                                if(n == 0 or n == 1 or n==2 or n==3):
                                    tmp.append(float(num))
                                else:
                                    tmp.append(num)
                            data.append(tmp)
                data = sorted(data, key=lambda x: x[1])
                alldata[g_index][n_index].append(data)

# print(alldata[0][0])


testdata = [["name","group","condition","theme","order","SpeakerBeforeAddressee","AdresseeAfterSpeaker","SideparticipantAfterBystander","SideparticipantAfterSpeaker","BystanderAfterSpeaker"]]
for index_gd,groupdata in enumerate(alldata):
    for index_nd,namedata in enumerate(groupdata):
        for index_cd,conditiondata in enumerate(namedata):
            sba=0
            aaf=0
            sab=0
            sas=0
            bas=0

            for index,item in enumerate(conditiondata):
                if(index != 0):
                    # 話し手になる前に受け手/話し手
                    # sba
                    if(index != 1):
                        if(item[4] == "speaker"):
                            if(beforeSpeaker(item[0],index,conditiondata)):
                                sba += 1

                    # 受け手になった後で話し手
                    if(item[4] == "addressee"):
                        if(afterAddressee(item[1],index,conditiondata)):
                            aaf += 1
                    
                    # 傍観者から傍参加者から話し手を挟まずに傍観者
                    if(item[4] == "bystander"):
                        if(bystanderTobystander(index,conditiondata)):
                            sab += 1

                    # 傍参加者から受け手にならずに話し手
                    if(item[4] == "sideparticipant"):
                        if(sideparticipantTospeaker(index,conditiondata)):
                            sas += 1

                    # 傍観者から話し手
                    if(len(conditiondata)-1 > index):
                        if(item[4]=="bystander" and conditiondata[index+1][4]=="speaker"):
                            bas += 1

            tmpdata = []
            tmpdata.append(names[index_gd][index_nd])
            tmpdata.append(groups[index_gd])
            tmpdata.append(condition[index_cd])
            tmpdata.append(theme[index_gd][index_cd])
            tmpdata.append(order[index_gd][index_cd])
            tmpdata.append(float(sba))
            tmpdata.append(float(aaf))
            tmpdata.append(float(sab))
            tmpdata.append(float(sas))
            tmpdata.append(float(bas))

            testdata.append(tmpdata)
            
# print(testdata)

with open('./testcsv/parstatest.csv'.format(group,c), 'w', newline="",encoding="utf-8") as g:
    writer = csv.writer(g, lineterminator='\n')
    for row in testdata:
        writer.writerow(row)